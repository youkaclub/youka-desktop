const fs = require("fs");
const join = require("path").join;
const mkdirp = require("mkdirp");
const ffmpeg = require("fluent-ffmpeg");
const checkDiskSpace = require("check-disk-space");

const lyricsFinder = require("./lyrics");
const gt = require("./google-translate");
const { Alignments } = require("./alignment");
const { alignmentsToAss } = require("./ass-alignment");
const rollbar = require("./rollbar");
const youtube = require("./youtube");
const youtubeDL = require("./youtube-dl");
const ffmpegi = require("./ffmpeg");
const { exists } = require("./utils");
const {
  HOME_PATH,
  ROOT,
  FFMPEG_PATH,
  BINARIES_PATH,
  DOWNLOAD_PATH,
} = require("./path");

export const FILE_MP4 = ".mp4";
export const FILE_MP3 = ".mp3";
export const FILE_M4A = ".m4a";
export const FILE_ASS = ".ass";
export const FILE_VTT = ".vtt";
export const FILE_TEXT = ".txt";
export const FILE_JSON = ".json";

export const MODE_MEDIA_ORIGINAL = "original";
export const MODE_MEDIA_INSTRUMENTS = "instruments";
export const MODE_MEDIA_VOCALS = "vocals";

export const MODE_CAPTIONS_LINE = "line";
export const MODE_CAPTIONS_WORD = "word";
export const MODE_CAPTIONS_FULL = "full";
export const MODE_CAPTIONS_OFF = "off";

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
    const fpath = filepath(id, MODE_MEDIA_INSTRUMENTS, FILE_MP4);
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

export function filepath(youtubeID, mode, file) {
  return join(ROOT, youtubeID, `${mode}${file}`);
}

export function fileurl(youtubeID, mode, file) {
  const fpath = filepath(youtubeID, mode, file);
  return `file://${fpath}`;
}

export async function files(youtubeID) {
  const fpath = filepath(youtubeID, MODE_MEDIA_INSTRUMENTS, FILE_MP4);
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
      case FILE_MP4:
        const fvurl = fileurl(youtubeID, mode, FILE_MP4);
        if (fvurl) {
          videos[mode] = fvurl;
        }
        break;
      case FILE_JSON:
        if ([MODE_CAPTIONS_LINE, MODE_CAPTIONS_WORD].includes(mode)) {
          try {
            const json = await fs.promises.readFile(
              join(ROOT, youtubeID, file),
              "utf-8"
            );
            const alignments = Alignments(json);
            if (alignments) {
              captions[mode] = alignmentsToAss(alignments).toString();
            }
          } catch (e) {
            rollbar.error(e);
          }
        }
        break;
      case FILE_VTT:
        const fcurl = fileurl(youtubeID, mode, ext);
        if (fcurl) {
          captions[mode] = fcurl;
        }
        break;
      default:
        break;
    }
  }

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

async function validateDiskSpace() {
  let freeMB = 200;
  try {
    const { free } = await checkDiskSpace(HOME_PATH);
    freeMB = free / 1000 / 1000;
  } catch (e) {
    rollbar.error(e);
    return;
  }
  if (freeMB < 200) {
    throw new Error(
      "Your disk is almost full, please delete unimportant files and try again"
    );
  }
}

export async function init(youtubeID) {
  await validateDiskSpace();
  await mkdirp(join(ROOT, youtubeID));
  await mkdirp(BINARIES_PATH);
  await mkdirp(DOWNLOAD_PATH);
  await ffmpegi.install();
  try {
    await youtubeDL.install();
    await youtubeDL.update();
  } catch (e) {
    rollbar.error(e);
  }
  process.env.FFMPEG_PATH = FFMPEG_PATH;
  ffmpeg.setFfmpegPath(FFMPEG_PATH);
}

export async function getAudio(youtubeID, mode) {
  const fp = filepath(youtubeID, mode, FILE_M4A);
  if (await exists(fp)) {
    return fs.promises.readFile(fp);
  }

  if (mode === MODE_MEDIA_ORIGINAL) {
    const audio = await youtube.downloadAudio(youtubeID);
    await fs.promises.writeFile(fp, audio);
    return audio;
  }
}

export async function getVideo(youtubeID, mode) {
  const fp = filepath(youtubeID, mode, FILE_MP4);
  if (await exists(fp)) {
    return fs.promises.readFile(fp);
  }

  if (mode === MODE_MEDIA_ORIGINAL) {
    const video = await youtube.downloadVideo(youtubeID);
    await fs.promises.writeFile(fp, video);
    return video;
  }

  await new Promise((resolve, reject) => {
    ffmpeg()
      .on("error", (error, stdout, stderr) => {
        rollbar.error(error, stdout, stderr);
        reject(error);
      })
      .on("end", () => resolve())
      .input(filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_MP4))
      .input(filepath(youtubeID, mode, FILE_M4A))
      .addOptions(["-vcodec copy", "-acodec copy", "-map 0:0", "-map 1:0"])
      .save(fp);
  });

  return fs.promises.readFile(fp);
}

export async function getLyrics(youtubeID, title) {
  const fp = filepath(youtubeID, MODE_LYRICS, FILE_TEXT);
  if (await exists(fp)) {
    const l = await fs.promises.readFile(fp, "utf8");
    if (l.trim() === "" || l === "undefined" || l === "null") return null;
    return l;
  }
  const lyrics = await lyricsFinder(title);
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
    rollbar.error(e);
    return null;
  }
}

export async function saveFiles(youtubeID, files) {
  const promises = files.map((file) =>
    fs.promises.writeFile(filepath(youtubeID, file.name, file.ext), file.buffer)
  );
  return Promise.all(promises);
}

export async function download(youtubeID, mediaMode, captionsMode, file) {
  await init(youtubeID);

  if (file === FILE_MP3) {
    return downloadAudio(youtubeID, mediaMode);
  } else if (file === FILE_MP4) {
    return downloadVideo(youtubeID, mediaMode, captionsMode);
  }
}

export async function downloadAudio(youtubeID, mediaMode) {
  const fpath = join(DOWNLOAD_PATH, `${youtubeID}-${mediaMode}${FILE_MP3}`);
  if (await exists(fpath)) {
    return fpath;
  }
  const srcPath = filepath(youtubeID, mediaMode, FILE_M4A);
  if (await exists(srcPath)) {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .on("error", (error, stdout, stderr) => {
          rollbar.error(error, stdout, stderr);
          reject(error);
        })
        .on("end", () => resolve())
        .input(srcPath)
        .audioCodec("libmp3lame")
        .audioBitrate(320)
        .save(fpath);
    });
    return fpath;
  }
}

export async function downloadVideo(youtubeID, mediaMode, captionsMode) {
  const fpath = join(
    DOWNLOAD_PATH,
    `${youtubeID}-${mediaMode}-${captionsMode}${FILE_MP4}`
  );
  if (await exists(fpath)) {
    return fpath;
  }

  const alignmentsPath = filepath(youtubeID, captionsMode, FILE_JSON);
  if (!(await exists(alignmentsPath))) {
    await fs.promises.copyFile(filepath(youtubeID, mediaMode, FILE_MP4), fpath);
    return fpath;
  }
  const json = await fs.promises.readFile(alignmentsPath, "utf-8");
  const alignments = new Alignments(json);
  const ass = alignmentsToAss(alignments);
  const captionsPath = filepath(youtubeID, captionsMode, FILE_ASS);
  await fs.promises.writeFile(captionsPath, ass, "utf-8");

  await new Promise((resolve, reject) => {
    ffmpeg()
      .on("error", (error, stdout, stderr) => {
        rollbar.error(error, stdout, stderr);
        reject(error);
      })
      .on("end", () => resolve())
      .input(filepath(youtubeID, mediaMode, FILE_MP4))
      .addOptions(["-vf", `ass=${captionsPath}`])
      .save(fpath);
  });
  return fpath;
}
