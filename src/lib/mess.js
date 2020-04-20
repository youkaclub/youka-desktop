const fs = require("fs");
const join = require("path").join;
const homedir = require("os").homedir();
const debug = require("debug")("youka:mess");
const ffmpeg = require("fluent-ffmpeg");
const ffbinaries = require("ffbinaries");
const mkdirp = require("mkdirp");
const needle = require("needle");
const youtube = require("./youtube");
const lyricsFinder = require("./lyrics");
const gt = require("./google-translate");

const FILE_VIDEO = ".mp4";
const FILE_AUDIO = ".m4a";
const FILE_CAPTIONS = ".vtt";
const FILE_TEXT = ".txt";
const FILE_JSON = ".json";

const MODE_MEDIA_ORIGINAL = "original";
const MODE_MEDIA_INSTRUMENTS = "instruments";
const MODE_MEDIA_VOCALS = "vocals";

const MODE_CAPTIONS_LINE = "line";
// const MODE_CAPTIONS_WORD = "word";

const MODE_LYRICS = "lyrics";
const MODE_INFO = "info";

const CAPTIONS_MODES = [MODE_CAPTIONS_LINE];

const MEDIA_MODES = [
  MODE_MEDIA_ORIGINAL,
  MODE_MEDIA_INSTRUMENTS,
  MODE_MEDIA_VOCALS,
];

const ROOT = join(homedir, ".youka", "youtube");
const BINARIES_PATH = join(homedir, ".youka", "binaries");
const FFMPEG_PATH = join(BINARIES_PATH, "ffmpeg");

async function info(youtubeID) {
  try {
    const fpath = join(ROOT, youtubeID, "info.json");
    const content = await fs.promises.readFile(fpath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function fileurl(youtubeID, mode, file) {
  const fpath = filepath(youtubeID, mode, file);
  return `file://${fpath}`;
}

function filepath(youtubeID, mode, file) {
  return join(ROOT, youtubeID, `${mode}${file}`);
}

async function files(youtubeID) {
  const fpath = filepath(youtubeID, MODE_MEDIA_INSTRUMENTS, FILE_VIDEO);
  if (!(await exists(fpath))) {
    await generate(youtubeID);
  }

  let videos = {};
  let captions = {};
  const files = await fs.promises.readdir(join(ROOT, youtubeID));
  for (const file of files) {
    const parts = file.split(".");
    const mode = parts[0];
    const ext = "." + parts[1];

    switch (ext) {
      case FILE_VIDEO:
        videos[mode] = fileurl(youtubeID, mode, FILE_VIDEO);
        break;
      case FILE_CAPTIONS:
        if (mode === MODE_CAPTIONS_LINE) {
          captions[mode] = fileurl(youtubeID, mode, FILE_CAPTIONS);
        }
        break;
      default:
        break;
    }
  }

  return { videos, captions };
}

async function generate(youtubeID) {
  debug("youtube-id", youtubeID);

  if (await exists(filepath(youtubeID, MODE_MEDIA_INSTRUMENTS, FILE_VIDEO))) {
    debug("video already exists");
    return;
  }

  debug("can't find video locally");

  if (!(await ffmpegExists())) {
    debug("download ffmpeg");
    await downloadFfpmeg();
  }

  process.env.FFMPEG_PATH = FFMPEG_PATH;
  ffmpeg.setFfmpegPath(FFMPEG_PATH);

  await mkdirp(join(ROOT, youtubeID));

  debug("download video");
  const originalVideoFilepath = filepath(
    youtubeID,
    MODE_MEDIA_ORIGINAL,
    FILE_VIDEO
  );
  if (!(await exists(originalVideoFilepath))) {
    const videoOriginal = await youtube.download(youtubeID);
    await fs.promises.writeFile(originalVideoFilepath, videoOriginal);
  }

  debug("find lyrics");
  const info = await youtube.info(youtubeID);
  await fs.promises.writeFile(
    filepath(youtubeID, MODE_INFO, FILE_JSON),
    JSON.stringify(info, null, 2),
    "utf-8"
  );
  const title = youtube.utils.cleanTitle(info.title);
  const lyrics = await lyricsFinder(title);

  debug("seperate audio");
  await new Promise((resolve, reject) => {
    ffmpeg(filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_VIDEO))
      .on("error", (error) => reject(error))
      .on("end", () => resolve())
      .addOptions(["-map 0:a", "-c copy"])
      .save(filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_AUDIO));
  });

  debug("split-align");
  const audioBuffer = await fs.promises.readFile(
    filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_AUDIO)
  );
  let data = {
    audio: {
      buffer: audioBuffer,
      filename: "audio",
      content_type: "application/octet-stream",
    },
  };
  if (lyrics) {
    await fs.promises.writeFile(
      filepath(youtubeID, MODE_LYRICS, FILE_TEXT),
      lyrics,
      "utf-8"
    );
    const transcriptBuffer = await fs.promises.readFile(
      filepath(youtubeID, MODE_LYRICS, FILE_TEXT)
    );

    data.transcript = {
      buffer: transcriptBuffer,
      filename: "transcript",
      content_type: "application/octet-stream",
    };
  }
  let apiurl = "https://api.audioai.online/split-align";
  if (lyrics) {
    debug("detect lyrics lang");
    try {
      const lang = await gt.language(lyrics);
      apiurl = `${apiurl}?lang=${lang}`;
    } catch (e) {
      debug(e);
    }
  }
  debug(apiurl);
  const response = await needle("post", apiurl, data, {
    multipart: true,
    user_agent: "Youka",
  });
  if (response.statusCode !== 200) {
    const message = response.body.message || "split failed";
    throw new Error(message);
  }
  const { audio, captions } = response.body;
  if (audio) {
    for (const [mode, value] of Object.entries(audio)) {
      const fpath = filepath(youtubeID, mode, FILE_AUDIO);
      await fs.promises.writeFile(fpath, value, "base64");
    }
  }
  if (captions) {
    for (const [mode, value] of Object.entries(captions)) {
      const fpath = filepath(youtubeID, mode, FILE_CAPTIONS);
      await fs.promises.writeFile(fpath, value, "base64");
    }
  }

  debug("create videos");
  const medias = [MODE_MEDIA_INSTRUMENTS, MODE_MEDIA_VOCALS];
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    await new Promise((resolve, reject) => {
      ffmpeg()
        .on("error", (error) => reject(error))
        .on("end", () => resolve())
        .input(filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_VIDEO))
        .input(filepath(youtubeID, media, FILE_AUDIO))
        .addOptions(["-vcodec copy", "-acodec copy", "-map 0:0", "-map 1:0"])
        .save(filepath(youtubeID, media, FILE_VIDEO));
    });
  }
}

async function ffmpegExists() {
  return exists(FFMPEG_PATH);
}

async function exists(filepath) {
  try {
    await fs.promises.stat(filepath);
    return true;
  } catch (e) {
    return false;
  }
}

async function downloadFfpmeg() {
  await mkdirp(BINARIES_PATH);
  await new Promise((resolve, reject) => {
    ffbinaries.downloadBinaries(
      "ffmpeg",
      { destination: BINARIES_PATH },
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

async function library() {
  if (!(await exists(ROOT))) {
    return [];
  }
  const files = await fs.promises.readdir(ROOT, { withFileTypes: true });
  const ids = files
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const items = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const inf = await info(id);
    if (inf) {
      items.push({
        id: id,
        image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        title: inf.title,
      });
    }
  }

  return items;
}

export {
  info,
  library,
  filepath,
  generate,
  ffmpegExists,
  downloadFfpmeg,
  files,
  MEDIA_MODES,
  CAPTIONS_MODES,
  FILE_VIDEO,
  FILE_CAPTIONS,
  MODE_MEDIA_INSTRUMENTS,
  MODE_CAPTIONS_LINE,
};
