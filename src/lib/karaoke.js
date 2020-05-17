const debug = require("debug")("youka:desktop");
const AsyncGraph = require("async-graph-resolver").AsyncGraph;
const library = require("./library");
const api = require("./api");

async function generate(youtubeID, title, onStatusChanged) {
  debug("youtube-id", youtubeID);

  async function run(status, fn) {
    onStatusChanged(status);
    return fn;
  }

  onStatusChanged("Initializing");
  await library.init(youtubeID);

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
      dependencies: ["postSplitAlign"],
    })
    .addNode({
      id: "getLanguage",
      run: ({ getLyrics }) => library.getLanguage(youtubeID, getLyrics),
      dependencies: ["getLyrics"],
    })
    .addNode({
      id: "getOriginalAudio",
      run: () =>
        run(
          "Downloading audio",
          library.getAudio(youtubeID, library.MODE_MEDIA_ORIGINAL)
        ),
    })
    .addNode({
      id: "postSplitAlign",
      run: ({ getOriginalAudio, getLyrics, getLanguage }) =>
        run(
          "Uploading files",
          api.postSplitAlign(
            youtubeID,
            getOriginalAudio,
            getLyrics,
            getLanguage
          )
        ),
      dependencies: ["getOriginalAudio", "getLyrics", "getLanguage"],
    })
    .addNode({
      id: "getSplitAlign",
      run: () =>
        run("Server is processing your song", api.getSplitAlign(youtubeID)),
      dependencies: ["postSplitAlign"],
    })
    .addNode({
      id: "getDownload",
      run: ({ getSplitAlign }) =>
        run("Downloading files", api.getDownload(youtubeID, getSplitAlign)),
      dependencies: ["getSplitAlign"],
    })
    .addNode({
      id: "saveFiles",
      run: ({ getDownload }) => library.saveFiles(youtubeID, getDownload),
      dependencies: ["getDownload"],
    })
    .addNode({
      id: "getInstrumentsVideo",
      run: () => library.getVideo(youtubeID, library.MODE_MEDIA_INSTRUMENTS),
      dependencies: ["getOriginalVideo", "saveFiles"],
    })
    .addNode({
      id: "getVocalsVideo",
      run: () => library.getVideo(youtubeID, library.MODE_MEDIA_VOCALS),
      dependencies: ["getOriginalVideo", "saveFiles"],
    });

  return graph.resolve();
}

export { generate };
