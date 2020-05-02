const debug = require("debug")("youka:desktop");
const AsyncGraph = require("async-graph-resolver").AsyncGraph;
const library = require("./library");

async function generate(youtubeID, title, onStatusChanged, upload) {
  debug("youtube-id", youtubeID);

  async function run(status, fn) {
    onStatusChanged(status);
    return fn;
  }

  onStatusChanged("Initializing");
  await library.init(youtubeID);

  let getSplitAlignDeps;
  if (upload) {
    getSplitAlignDeps = ["getOriginalAudio", "getLyrics", "getLanguage"];
  } else {
    getSplitAlignDeps = ["getLyrics", "getLanguage"];
  }

  const graph = new AsyncGraph()
    .addNode({
      id: "getLyrics",
      run: () => run("Searching lyrics", library.getLyrics(youtubeID, title)),
    })
    .addNode({
      id: "getInfo",
      run: () => library.getInfo(youtubeID),
    })
    .addNode({
      id: "getOriginalVideo",
      run: () =>
        run(
          "Downloading video",
          library.getVideo(youtubeID, library.MODE_MEDIA_ORIGINAL)
        ),
    })
    .addNode({
      id: "getLanguage",
      run: ({ getLyrics }) => library.getLanguage(youtubeID, getLyrics),
      dependencies: ["getLyrics"],
    })
    .addNode({
      id: "getOriginalAudio",
      run: () => library.getAudio(youtubeID, library.MODE_MEDIA_ORIGINAL),
    })
    .addNode({
      id: "getSplitAlign",
      run: ({ getOriginalAudio, getLyrics, getLanguage }) =>
        run(
          "Separating instruments and vocals",
          library.getSplitAlign(
            youtubeID,
            getOriginalAudio,
            getLyrics,
            getLanguage,
            upload
          )
        ),
      dependencies: getSplitAlignDeps,
    })
    .addNode({
      id: "getInstrumentsVideo",
      run: () => library.getVideo(youtubeID, library.MODE_MEDIA_INSTRUMENTS),
      dependencies: ["getSplitAlign"],
    })
    .addNode({
      id: "getVocalsVideo",
      run: () => library.getVideo(youtubeID, library.MODE_MEDIA_VOCALS),
      dependencies: ["getSplitAlign"],
    });

  return graph.resolve();
}

export { generate };
