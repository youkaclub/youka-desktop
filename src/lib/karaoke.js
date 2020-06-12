const debug = require("debug")("youka:desktop");
const rp = require("request-promise");
const library = require("./library");
const Client = require("./client");
const retry = require("promise-retry");

const client = new Client();

async function generate(youtubeID, title, onStatus) {
  debug("youtube-id", youtubeID);

  onStatus("Initializing");
  await library.init(youtubeID);

  onStatus("Searching lyrics");
  const lyrics = await library.getLyrics(youtubeID, title);

  onStatus("Downloading audio");
  const originalAudio = await library.getAudio(
    youtubeID,
    library.MODE_MEDIA_ORIGINAL
  );

  onStatus("Uploading files");
  const audioUrl = await client.upload(originalAudio);

  let lang, transcriptUrl;
  if (lyrics) {
    lang = await library.getLanguage(youtubeID, lyrics);
    transcriptUrl = await client.upload(lyrics);
  }

  const promises = [
    split(youtubeID, audioUrl),
    library.getVideo(youtubeID, library.MODE_MEDIA_ORIGINAL),
    library.getInfo(youtubeID),
  ];
  if (lang === "en") {
    promises.push(align(youtubeID, audioUrl, transcriptUrl, lang, "word"));
  }
  onStatus("Server is processing your song");
  const [splitResult] = await Promise.all(promises);
  const vocalsUrl = splitResult.vocalsUrl;

  if (lyrics && lang) {
    const alignPromises = [
      align(youtubeID, vocalsUrl, transcriptUrl, lang, "line"),
    ];
    if (lang !== "en") {
      alignPromises.push(
        align(youtubeID, vocalsUrl, transcriptUrl, lang, "word")
      );
    }
    await Promise.all(alignPromises);
  }

  await library.getVideo(youtubeID, library.MODE_MEDIA_INSTRUMENTS);
  await library.getVideo(youtubeID, library.MODE_MEDIA_VOCALS);
}

async function align(youtubeID, audioUrl, transcriptUrl, lang, mode) {
  const queue = lang === "en" ? "alignen" : "align";
  const jobId = await client.enqueue(queue, {
    audioUrl,
    transcriptUrl,
    options: { mode, lang },
  });
  const success = await client.wait(queue, jobId);
  if (!success) return;
  const { alignmentsUrl } = await client.result(queue, jobId);
  const alignments = await retry((r) =>
    rp({
      uri: alignmentsUrl,
      encoding: "utf-8",
    }).catch(r)
  );
  await library.saveFile(youtubeID, mode, library.FILE_JSON, alignments);
}

async function split(youtubeID, audioUrl) {
  const splitJobId = await client.enqueue("split", { audioUrl });
  const success = await client.wait("split", splitJobId);
  if (!success) throw new Error("Processing failed");
  const splitResult = await client.result("split", splitJobId);
  const [vocals, instruments] = await Promise.all([
    retry((r) => rp({ uri: splitResult.vocalsUrl, encoding: null }).catch(r)),
    retry((r) =>
      rp({
        uri: splitResult.instrumentsUrl,
        encoding: null,
      }).catch(r)
    ),
  ]);
  await library.saveFile(
    youtubeID,
    library.MODE_MEDIA_INSTRUMENTS,
    library.FILE_M4A,
    instruments
  );
  await library.saveFile(
    youtubeID,
    library.MODE_MEDIA_VOCALS,
    library.FILE_M4A,
    vocals
  );

  return splitResult;
}

module.exports = {
  generate,
};
