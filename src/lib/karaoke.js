const debug = require("debug")("youka:desktop");
const AsyncGraph = require("async-graph-resolver").AsyncGraph;
const library = require("./library");
const youtube = require("./youtube");
const api = require("./api");
const getLyrics = require("./lyrics");
const gt = require("./google-translate");

async function getLanguage(s) {
  if (!s || s.trim() === "") return null;
  return gt.language(s);
}

async function generate(youtubeID, title, onStatusChanged) {
  debug("youtube-id", youtubeID);

  async function run(status, fn) {
    onStatusChanged(status);
    return fn;
  }

  await library.init(youtubeID);

  const graph = new AsyncGraph()
    .addNode({
      id: "getLyrics",
      run: () => run("Search for lyrics", getLyrics(title)),
    })
    .addNode({
      id: "saveLyrics",
      run: ({ getLyrics }) => library.saveLyrics(youtubeID, getLyrics),
      dependencies: ["getLyrics"],
    })
    .addNode({
      id: "getInfo",
      run: () => youtube.info(youtubeID),
    })
    .addNode({
      id: "saveInfo",
      run: ({ getInfo }) => library.saveInfo(youtubeID, getInfo),
      dependencies: ["getInfo"],
    })
    .addNode({
      id: "getVideo",
      run: () =>
        run(
          "Download video",
          library.getVideo(youtubeID, library.MODE_MEDIA_ORIGINAL)
        ),
    })
    .addNode({
      id: "saveVideoOriginal",
      run: ({ getVideo }) => library.saveVideo(youtubeID, getVideo),
      dependencies: ["getVideo"],
    })
    .addNode({
      id: "getLanguage",
      run: ({ getLyrics }) => getLanguage(getLyrics),
      dependencies: ["getLyrics"],
    })
    .addNode({
      id: "saveAudioOriginal",
      run: () =>
        run(
          "Separate video and audio",
          library.saveAudio(youtubeID, library.MODE_MEDIA_ORIGINAL)
        ),
      dependencies: ["saveVideoOriginal"],
    })
    .addNode({
      id: "getAudioOriginal",
      run: () => library.getAudio(youtubeID, library.MODE_MEDIA_ORIGINAL),
      dependencies: ["saveAudioOriginal"],
    })
    .addNode({
      id: "getSplitAlign",
      run: ({ getAudioOriginal, getLyrics, getLanguage }) =>
        run(
          "Separate instruments and vocals",
          api.getSplitAlign(null, getAudioOriginal, getLyrics, getLanguage)
        ),
      dependencies: ["getAudioOriginal", "getLyrics", "getLanguage"],
    })
    .addNode({
      id: "saveBase64Audio",
      run: ({ getSplitAlign }) =>
        run(
          "Save instruments and vocals audio",
          library.saveBase64(youtubeID, getSplitAlign.audio, library.FILE_AUDIO)
        ),
      dependencies: ["getSplitAlign"],
    })
    .addNode({
      id: "saveBase64Captions",
      run: ({ getSplitAlign }) =>
        run(
          "Save captions",
          library.saveBase64(
            youtubeID,
            getSplitAlign.captions,
            library.FILE_CAPTIONS
          )
        ),
      dependencies: ["getSplitAlign"],
    })
    .addNode({
      id: "saveVideoInstruments",
      run: () =>
        run(
          "Create instruments video",
          library.saveVideoMode(youtubeID, library.MODE_MEDIA_INSTRUMENTS)
        ),
      dependencies: ["saveBase64Audio"],
    })
    .addNode({
      id: "saveVideoVocals",
      run: () =>
        run(
          "Create vocals video",
          library.saveVideoMode(youtubeID, library.MODE_MEDIA_VOCALS)
        ),
      dependencies: ["saveBase64Audio"],
    });

  return graph.resolve();
}

export { generate };
