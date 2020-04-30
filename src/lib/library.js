const fs = require("fs");
const homedir = require("os").homedir();
const join = require("path").join;
const ffmpeg = require("fluent-ffmpeg");
const ffbinaries = require("ffbinaries");
const mkdirp = require("mkdirp");
const youtube = require("./youtube");

const ROOT = join(homedir, ".youka", "youtube");

const BINARIES_PATH = join(homedir, ".youka", "binaries");
const FFMPEG_PATH = join(BINARIES_PATH, "ffmpeg");

export const FILE_VIDEO = ".mp4";
export const FILE_AUDIO = ".m4a";
export const FILE_CAPTIONS = ".vtt";
export const FILE_TEXT = ".txt";
export const FILE_JSON = ".json";

export const MODE_MEDIA_ORIGINAL = "original";
export const MODE_MEDIA_INSTRUMENTS = "instruments";
export const MODE_MEDIA_VOCALS = "vocals";

export const MODE_CAPTIONS_LINE = "line";
export const MODE_CAPTIONS_WORD = "word";

export const MODE_LYRICS = "lyrics";
export const MODE_INFO = "info";

export const CAPTIONS_MODES = [MODE_CAPTIONS_LINE, MODE_CAPTIONS_WORD];

export const MEDIA_MODES = [
  MODE_MEDIA_ORIGINAL,
  MODE_MEDIA_INSTRUMENTS,
  MODE_MEDIA_VOCALS,
];

export async function videos() {
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
    const fpath = filepath(id, MODE_MEDIA_INSTRUMENTS, FILE_VIDEO);
    if (!(await exists(fpath))) {
      continue;
    }
    const inf = await info(id);
    if (inf) {
      items.push({
        id: id,
        image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        title: youtube.utils.cleanTitle(inf.title),
      });
    }
  }

  return items;
}

export async function exists(filepath) {
  try {
    await fs.promises.stat(filepath);
    return true;
  } catch (e) {
    return false;
  }
}

export function filepath(youtubeID, mode, file) {
  return join(ROOT, youtubeID, `${mode}${file}`);
}

export function fileurl(youtubeID, mode, file) {
  const fpath = filepath(youtubeID, mode, file);
  return `file://${fpath}`;
}

export async function files(youtubeID) {
  const fpath = filepath(youtubeID, MODE_MEDIA_INSTRUMENTS, FILE_VIDEO);
  if (!(await exists(fpath))) {
    return null;
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
        const fvurl = fileurl(youtubeID, mode, FILE_VIDEO);
        if (fvurl) {
          videos[mode] = fvurl;
        }
        break;
      case FILE_CAPTIONS:
        const fcurl = fileurl(youtubeID, mode, FILE_CAPTIONS);
        if (fcurl) {
          captions[mode] = fcurl;
        }
        break;
      default:
        break;
    }
  }

  captions["off"] = null;

  return { videos, captions };
}

export async function saveBase64(youtubeID, obj, file) {
  const ps = [];
  if (obj) {
    for (const [mode, value] of Object.entries(obj)) {
      const fpath = filepath(youtubeID, mode, file);
      ps.push(fs.promises.writeFile(fpath, value, "base64"));
    }
  }
  return Promise.all(ps);
}

export async function saveVideoMode(youtubeID, mode) {
  await new Promise((resolve, reject) => {
    ffmpeg()
      .on("error", (error) => reject(error))
      .on("end", () => resolve())
      .input(filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_VIDEO))
      .input(filepath(youtubeID, mode, FILE_AUDIO))
      .addOptions(["-vcodec copy", "-acodec copy", "-map 0:0", "-map 1:0"])
      .save(filepath(youtubeID, mode, FILE_VIDEO));
  });
}

export async function saveLyrics(youtubeID, lyrics) {
  return fs.promises.writeFile(
    filepath(youtubeID, MODE_LYRICS, FILE_TEXT),
    lyrics,
    "utf-8"
  );
}

export async function saveInfo(youtubeID, i) {
  return fs.promises.writeFile(
    filepath(youtubeID, MODE_INFO, FILE_JSON),
    JSON.stringify(i, null, 2),
    "utf-8"
  );
}

export async function saveVideo(youtubeID, video) {
  return fs.promises.writeFile(
    filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_VIDEO),
    video
  );
}

export async function info(youtubeID) {
  try {
    const fpath = join(ROOT, youtubeID, "info.json");
    const content = await fs.promises.readFile(fpath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

export async function init(youtubeID) {
  await mkdirp(join(ROOT, youtubeID));
  await initFfmpeg();
}

export async function ffmpegExists() {
  return exists(FFMPEG_PATH);
}

export async function downloadFfpmeg() {
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

export async function initFfmpeg() {
  if (!(await ffmpegExists())) {
    await downloadFfpmeg();
  }
  process.env.FFMPEG_PATH = FFMPEG_PATH;
  ffmpeg.setFfmpegPath(FFMPEG_PATH);
}

export async function saveAudio(youtubeID, mode) {
  return new Promise((resolve, reject) => {
    ffmpeg(filepath(youtubeID, mode, FILE_VIDEO))
      .on("error", (error) => reject(error))
      .on("end", () => resolve())
      .addOptions(["-map 0:a", "-c copy"])
      .save(filepath(youtubeID, mode, FILE_AUDIO));
  });
}

export async function getAudio(youtubeID, mode) {
  return fs.promises.readFile(filepath(youtubeID, mode, FILE_AUDIO));
}

export async function getVideo(youtubeID, mode) {
  const fp = filepath(youtubeID, mode, FILE_VIDEO);
  if (await exists(fp)) {
    return fs.promises.readFile(fp);
  }
  return youtube.download(youtubeID);
}
