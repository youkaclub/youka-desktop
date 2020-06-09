const debug = require("debug")("youka:desktop");
const rp = require("request-promise");
const library = require("./library");
const Client = require("./client");

const client = new Client();

async function align(youtubeID, audioUrl, transcriptUrl, lang, mode) {
  const queue = lang === "en" ? "alignen" : "align";
  const jobId = await client.enqueue(queue, {
    audioUrl,
    transcriptUrl,
    options: { mode, lang },
  });
  await client.wait(queue, jobId);
  const { alignmentsUrl } = await client.result(queue, jobId);
  const alignments = await rp({
    uri: alignmentsUrl,
    encoding: "utf-8",
  });
  await library.saveFile(youtubeID, mode, library.FILE_JSON, alignments);
}

async function split(youtubeID, audioUrl) {
  const splitJobId = await client.enqueue("split", { audioUrl });
  await client.wait("split", splitJobId);
  const splitResult = await client.result("split", splitJobId);
  const [vocals, instruments] = await Promise.all([
    rp({ uri: splitResult.vocalsUrl, encoding: null }),
    rp({
      uri: splitResult.instrumentsUrl,
      encoding: null,
    }),
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
async function generate(youtubeID, title, onStatusChanged) {
  debug("youtube-id", youtubeID);

  onStatusChanged("Initializing");
  await library.init(youtubeID);

  onStatusChanged("Searching lyrics");
  const lyrics = await library.getLyrics(youtubeID, title);

  onStatusChanged("Downloading audio");
  const originalAudio = await library.getAudio(
    youtubeID,
    library.MODE_MEDIA_ORIGINAL
  );

  onStatusChanged("Uploading files");
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
  onStatusChanged("Server is processing your song");
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

export { generate };
