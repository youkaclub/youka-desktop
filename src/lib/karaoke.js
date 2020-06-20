const debug = require("debug")("youka:desktop");
const rp = require("request-promise");
const library = require("./library");
const client = require("./client");
const rollbar = require("./rollbar");

async function generate(youtubeID, title, onStatus) {
  debug("youtube-id", youtubeID);

  onStatus("Initializing");
  await library.init(youtubeID);

  onStatus("Downloading audio");
  const originalAudio = await library.getAudio(
    youtubeID,
    library.MODE_MEDIA_ORIGINAL
  );

  onStatus("Uploading files");
  const audioUrl = await client.upload(originalAudio);
  const splitJobId = await client.enqueue(client.QUEUE_SPLIT, { audioUrl });

  onStatus("Searching lyrics");
  const lyrics = await library.getLyrics(youtubeID, title);

  let shouldAlign = false;
  let lang;
  let alignWordJobId;
  let alignLineJobId;
  let alignWordQueue;
  let transcriptUrl;

  if (lyrics) {
    lang = await library.getLanguage(youtubeID, lyrics);
    debug("lang", lang);
    shouldAlign = SUPPORTED_LANGS.includes(lang);
    transcriptUrl = await client.upload(lyrics);
    if (lang === "en") {
      alignWordQueue = client.QUEUE_ALIGN_EN;
      alignWordJobId = await client.enqueue(client.QUEUE_ALIGN_EN, {
        audioUrl,
        transcriptUrl,
      });
    } else if (shouldAlign) {
      alignWordQueue = client.QUEUE_ALIGN;
    }
  }

  onStatus("Downloading video");
  await library.getVideo(youtubeID, library.MODE_MEDIA_ORIGINAL);
  await library.getInfo(youtubeID);

  const splitJob = await client.wait(client.QUEUE_SPLIT, splitJobId, onStatus);
  if (
    !splitJob ||
    !splitJob.result ||
    !splitJob.result.vocalsUrl ||
    !splitJob.result.instrumentsUrl
  ) {
    throw new Error("Processing failed");
  }

  if (shouldAlign) {
    alignLineJobId = await client.enqueue(client.QUEUE_ALIGN, {
      audioUrl: splitJob.result.vocalsUrl,
      transcriptUrl,
      options: { mode: library.MODE_CAPTIONS_LINE, lang },
    });

    if (lang !== "en") {
      alignWordJobId = await client.enqueue(client.QUEUE_ALIGN, {
        audioUrl: splitJob.result.vocalsUrl,
        transcriptUrl,
        options: { mode: library.MODE_CAPTIONS_WORD, lang },
      });
    }
  }

  onStatus("Downloading files");
  const [instruments, vocals] = await Promise.all([
    rp({ uri: splitJob.result.instrumentsUrl, encoding: null }),
    rp({ uri: splitJob.result.vocalsUrl, encoding: null }),
  ]);

  if (shouldAlign) {
    try {
      const alignLineJob = await client.wait(
        client.QUEUE_ALIGN,
        alignLineJobId,
        onStatus
      );
      if (
        alignLineJob &&
        alignLineJob.result &&
        alignLineJob.result.alignmentsUrl
      ) {
        const lineAlignments = await rp({
          uri: alignLineJob.result.alignmentsUrl,
          encoding: "utf-8",
        });
        await library.saveFile(
          youtubeID,
          library.MODE_CAPTIONS_LINE,
          library.FILE_JSON,
          lineAlignments
        );
      }
    } catch (e) {
      console.log(e);
      rollbar.error(e);
    }

    try {
      const alignWordJob = await client.wait(
        alignWordQueue,
        alignWordJobId,
        onStatus
      );
      if (
        alignWordJob &&
        alignWordJob.result &&
        alignWordJob.result.alignmentsUrl
      ) {
        const wordAlignments = await rp({
          uri: alignWordJob.result.alignmentsUrl,
          encoding: "utf-8",
        });
        await library.saveFile(
          youtubeID,
          library.MODE_CAPTIONS_WORD,
          library.FILE_JSON,
          wordAlignments
        );
      }
    } catch (e) {
      console.log(e);
      rollbar.error(e);
    }
  }

  await Promise.all([
    library.saveFile(
      youtubeID,
      library.MODE_MEDIA_INSTRUMENTS,
      library.FILE_M4A,
      instruments
    ),
    library.saveFile(
      youtubeID,
      library.MODE_MEDIA_VOCALS,
      library.FILE_M4A,
      vocals
    ),
  ]);

  await Promise.all([
    library.getVideo(youtubeID, library.MODE_MEDIA_INSTRUMENTS),
    library.getVideo(youtubeID, library.MODE_MEDIA_VOCALS),
  ]);
}

async function alignline(youtubeID, onStatus) {
  const queue = client.QUEUE_ALIGN_LINE;
  const alignments = await library.getAlignments(
    youtubeID,
    library.MODE_CAPTIONS_LINE
  );
  if (!alignments || !alignments.length)
    throw new Error("Line level sync not found");

  const lang = await library.getLanguage(youtubeID);
  if (!lang) throw new Error("Can't detect language");

  const audio = await library.getAudio(youtubeID, library.MODE_MEDIA_VOCALS);
  if (!audio) throw new Error("Can't find vocals");
  onStatus("Uploading files");
  const audioUrl = await client.upload(audio);
  const alignmentsUrl = await client.upload(JSON.stringify(alignments));
  const jobId = await client.enqueue(queue, {
    audioUrl,
    alignmentsUrl,
    options: { lang },
  });
  const job = await client.wait(queue, jobId, onStatus);
  if (!job || !job.result || !job.result.alignmentsUrl)
    throw new Error("Sync failed");
  const wordAlignments = await rp({
    uri: job.result.alignmentsUrl,
    encoding: "utf-8",
  });
  await library.saveFile(
    youtubeID,
    library.MODE_CAPTIONS_WORD,
    library.FILE_JSON,
    wordAlignments
  );
}

async function realign(youtubeID, title, mode, onStatus) {
  const lyrics = await library.getLyrics(youtubeID, title);
  if (!lyrics) throw new Error("Lyrics is empty");
  const lang = await library.getLanguage(youtubeID, lyrics, true);
  if (!lang) throw new Error("Can't detect language");
  const audioMode =
    lang === "en" ? library.MODE_MEDIA_ORIGINAL : library.MODE_MEDIA_VOCALS;
  const queue = lang === "en" ? client.QUEUE_ALIGN_EN : client.QUEUE_ALIGN;
  const audio = await library.getAudio(youtubeID, audioMode);
  const audioUrl = await client.upload(audio);
  const transcriptUrl = await client.upload(lyrics);
  const jobId = await client.enqueue(queue, {
    audioUrl,
    transcriptUrl,
    options: { mode, lang },
  });
  const job = await client.wait(queue, jobId, onStatus);
  if (!job || !job.result || !job.result.alignmentsUrl)
    throw new Error("Sync failed");
  const alignments = await rp({
    uri: job.result.alignmentsUrl,
    encoding: "utf-8",
  });
  await library.saveFile(youtubeID, mode, library.FILE_JSON, alignments);
}

const SUPPORTED_LANGS = [
  "af",
  "am",
  "an",
  "ar",
  "as",
  "az",
  "ba",
  "bg",
  "bn",
  "bpy",
  "bs",
  "ca",
  "cmn",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "eo",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fr",
  "ga",
  "gd",
  "gn",
  "grc",
  "gu",
  "hak",
  "hi",
  "hr",
  "ht",
  "hu",
  "hy",
  "hyw",
  "ia",
  "id",
  "is",
  "it",
  "ja",
  "jbo",
  "ka",
  "kk",
  "kl",
  "kn",
  "ko",
  "kok",
  "ku",
  "ky",
  "la",
  "lfn",
  "lt",
  "lv",
  "mi",
  "mk",
  "ml",
  "mr",
  "ms",
  "mt",
  "my",
  "nb",
  "nci",
  "ne",
  "nl",
  "om",
  "or",
  "pa",
  "pap",
  "pl",
  "pt",
  "py",
  "quc",
  "ro",
  "ru",
  "sd",
  "shn",
  "si",
  "sk",
  "sl",
  "sq",
  "sr",
  "sv",
  "sw",
  "ta",
  "te",
  "tn",
  "tr",
  "tt",
  "ur",
  "uz",
  "vi",
  "yue",
  "zh",
];

module.exports = {
  generate,
  realign,
  alignline,
  SUPPORTED_LANGS,
};
