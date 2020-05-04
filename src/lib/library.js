const fs = require("fs");
const homedir = require("os").homedir();
const join = require("path").join;
const ffmpeg = require("fluent-ffmpeg");
const ffbinaries = require("ffbinaries");
const mkdirp = require("mkdirp");
const retry = require("promise.retry");
const lyricsFinder = require("./lyrics");
const youtube = require("./youtube");
const gt = require("./google-translate");

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
export const MODE_CAPTIONS_OFF = "word";

export const MODE_LYRICS = "lyrics";
export const MODE_INFO = "info";
export const MODE_LANG = "lang";

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
    const inf = await getInfo(id);
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

export async function getAudio(youtubeID, mode) {
  const fp = filepath(youtubeID, mode, FILE_AUDIO);
  if (await exists(fp)) {
    return fs.promises.readFile(fp);
  }

  if (mode === MODE_MEDIA_ORIGINAL) {
    const audio = await retry(
      () => youtube.download(youtubeID, { quality: 140 }),
      {
        times: 3,
      }
    )();
    await fs.promises.writeFile(fp, audio);
    return audio;
  }
}

export async function getVideo(youtubeID, mode) {
  const fp = filepath(youtubeID, mode, FILE_VIDEO);
  if (await exists(fp)) {
    return fs.promises.readFile(fp);
  }

  if (mode === MODE_MEDIA_ORIGINAL) {
    const video = await retry(
      () => youtube.download(youtubeID, { quality: 18 }),
      {
        times: 3,
      }
    )();
    await fs.promises.writeFile(fp, video);
    return video;
  }

  await new Promise((resolve, reject) => {
    ffmpeg()
      .on("error", (error) => reject(error))
      .on("end", () => resolve())
      .input(filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_VIDEO))
      .input(filepath(youtubeID, mode, FILE_AUDIO))
      .addOptions(["-vcodec copy", "-acodec copy", "-map 0:0", "-map 1:0"])
      .save(fp);
  });

  return fs.promises.readFile(fp);
}

export async function getLyrics(youtubeID, title) {
  const fp = filepath(youtubeID, MODE_LYRICS, FILE_TEXT);
  if (await exists(fp)) {
    return fs.promises.readFile(fp);
  }
  const lyrics = (await lyricsFinder(title)) || "";
  await fs.promises.writeFile(fp, lyrics, "utf8");
  return lyrics;
}

export async function getInfo(youtubeID) {
  const fp = filepath(youtubeID, MODE_INFO, FILE_JSON);
  if (await exists(fp)) {
    return JSON.parse(await fs.promises.readFile(fp));
  }
  const info = (await youtube.info(youtubeID)) || {};
  await fs.promises.writeFile(fp, JSON.stringify(info, null, 2), "utf8");
  return info;
}

export async function getLanguage(youtubeID, s) {
  try {
    const fp = filepath(youtubeID, MODE_LANG, FILE_TEXT);
    if (await exists(fp)) {
      return fs.promises.readFile(fp, "utf8");
    }
    const lang = await gt.language(s);
    await fs.promises.writeFile(fp, lang);
    return lang;
  } catch (e) {
    return null;
  }
}

export async function saveSplitAlign(youtubeID, audio, captions) {
  await saveBase64(youtubeID, audio, FILE_AUDIO);
  await saveBase64(youtubeID, captions, FILE_CAPTIONS);
}
