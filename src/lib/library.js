const fs = require("fs");
const join = require("path").join;
const mkdirp = require("mkdirp");
const tmp = require("tmp-promise");
const execa = require("execa");
const ffmpeg = require("fluent-ffmpeg");
const checkDiskSpace = require("check-disk-space");
const filenamify = require("filenamify");
const rp = require("request-promise");

const lyricsFinder = require("./lyrics");
const gt = require("./google-translate");
const { Alignments } = require("./alignment");
const { alignmentsToAss } = require("./ass-alignment");
const rollbar = require("./rollbar");
const youtube = require("./youtube");
const youtubeDL = require("./youtube-dl");
const ffmpegi = require("./ffmpeg");
const soundstretch = require("./soundstretch");
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
export const FILE_WAV = ".wav";
export const FILE_MKV = ".mkv";
export const FILE_ASS = ".ass";
export const FILE_VTT = ".vtt";
export const FILE_TEXT = ".txt";
export const FILE_JSON = ".json";

export const MODE_MEDIA_ORIGINAL = "original";
export const MODE_MEDIA_INSTRUMENTS = "instruments";
export const MODE_MEDIA_VOCALS = "vocals";
export const MODE_MEDIA_PITCH = "pitch";

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
        if (
          [
            MODE_MEDIA_INSTRUMENTS,
            MODE_MEDIA_ORIGINAL,
            MODE_MEDIA_VOCALS,
          ].includes(mode)
        ) {
          const fvurl = fileurl(youtubeID, mode, FILE_MP4);
          if (fvurl) {
            videos[mode] = fvurl;
          }
        }
        break;
      case FILE_JSON:
        if ([MODE_CAPTIONS_LINE, MODE_CAPTIONS_WORD].includes(mode)) {
          try {
            const json = await fs.promises.readFile(
              join(ROOT, youtubeID, file),
              "utf-8"
            );
            const als = JSON.parse(json);
            if (als) {
              const ass = alignmentsToAss(als);
              if (ass) {
                captions[mode] = ass.toString();
              }
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

async function validateDiskSpace() {
  let freeMB = 200;
  try {
    const { free } = await checkDiskSpace(HOME_PATH);
    freeMB = free / 1000 / 1000;
  } catch (e) {
    console.log(e);
    return;
  }
  if (freeMB < 200) {
    throw new Error(
      "Your disk is almost full, please delete unimportant files and try again"
    );
  }
}

export function initffmpeg() {
  process.env.FFMPEG_PATH = FFMPEG_PATH;
  ffmpeg.setFfmpegPath(FFMPEG_PATH);
}

export async function initSSL() {
  try {
    await rp("https://static.youka.club/ping.json");
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  } catch (e) {
    rollbar.warn(e);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}

export async function init(youtubeID) {
  await initSSL();
  await validateDiskSpace();
  await mkdirp(join(ROOT, youtubeID));
  await mkdirp(BINARIES_PATH);
  await mkdirp(DOWNLOAD_PATH);
  await ffmpegi.install();
  try {
    await youtubeDL.install();
    await youtubeDL.update();
    await soundstretch.install();
  } catch (e) {
    console.log(e);
    rollbar.error(e);
  }
  initffmpeg();
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

export async function setLyrics(youtubeID, lyrics) {
  const fp = filepath(youtubeID, MODE_LYRICS, FILE_TEXT);
  return fs.promises.writeFile(fp, lyrics, "utf8");
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

export async function getLanguage(youtubeID, s, force) {
  try {
    const fp = filepath(youtubeID, MODE_LANG, FILE_TEXT);
    if (!force && (await exists(fp))) {
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

export async function getAlignments(youtubeID, mode) {
  const fpath = filepath(youtubeID, mode, FILE_JSON);
  if (await exists(fpath)) {
    const alignments = JSON.parse(await fs.promises.readFile(fpath, "utf-8"));
    return alignments;
  }
  return [];
}

export async function setAlignments(youtubeID, mode, alignments) {
  const fpath = filepath(youtubeID, mode, FILE_JSON);
  await fs.promises.writeFile(
    fpath,
    JSON.stringify(alignments, null, 2),
    "utf-8"
  );
}

export async function getTitle(youtubeID) {
  const info = await getInfo(youtubeID);
  return youtube.utils.cleanTitle(info.title);
}

export async function saveFile(youtubeID, mode, file, buffer) {
  const fp = filepath(youtubeID, mode, file);
  return fs.promises.writeFile(fp, buffer);
}

export async function getWav(youtubeID, mediaMode) {
  const fpath = filepath(youtubeID, mediaMode, FILE_WAV);
  if (await exists(fpath)) return fpath;
  const srcPath = filepath(youtubeID, mediaMode, FILE_M4A);
  await new Promise((resolve, reject) => {
    ffmpeg()
      .on("error", (error, stdout, stderr) => {
        rollbar.error(error, stdout, stderr);
        reject(error);
      })
      .on("end", () => resolve())
      .input(srcPath)
      .audioCodec("pcm_s16le")
      .save(fpath);
  });
  return fpath;
}

export async function getPitch(youtubeID, mediaMode, n) {
  await soundstretch.install();
  initffmpeg();
  const input = await getWav(youtubeID, mediaMode);
  const pitchWav = filepath(youtubeID, MODE_MEDIA_PITCH, FILE_WAV);
  const pitchMkv = filepath(youtubeID, MODE_MEDIA_PITCH, FILE_MKV);
  await soundstretch.pitch(input, pitchWav, n);
  await new Promise((resolve, reject) => {
    ffmpeg()
      .on("error", (error, stdout, stderr) => {
        rollbar.error(error, stdout, stderr);
        reject(error);
      })
      .on("end", () => resolve())
      .input(filepath(youtubeID, MODE_MEDIA_ORIGINAL, FILE_MP4))
      .input(pitchWav)
      .addOptions(["-vcodec copy", "-acodec copy", "-map 0:0", "-map 1:0"])
      .save(pitchMkv);
  });

  const url = fileurl(youtubeID, MODE_MEDIA_PITCH, FILE_MKV);
  return url;
}

export async function download(
  youtubeID,
  mediaMode,
  captionsMode,
  file,
  pitch
) {
  await init(youtubeID);

  if (file === FILE_MP3) {
    return downloadAudio(youtubeID, mediaMode, pitch);
  } else if (file === FILE_MP4) {
    return downloadVideo(youtubeID, mediaMode, captionsMode, pitch);
  }
}

export async function downloadAudio(youtubeID, mediaMode, pitch) {
  const filename = `${youtubeID}-${mediaMode}${FILE_MP3}`;
  const fpath = join(DOWNLOAD_PATH, filenamify(filename, { replacement: "" }));
  const srcPath =
    pitch === 0
      ? filepath(youtubeID, mediaMode, FILE_M4A)
      : filepath(youtubeID, MODE_MEDIA_PITCH, FILE_WAV);
  const tmpPath = await tmp.tmpName({ postfix: FILE_MP3 });
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
      .save(tmpPath);
  });
  await fs.promises.copyFile(tmpPath, fpath);
  await fs.promises.unlink(tmpPath);
  return fpath;
}

export async function downloadVideo(youtubeID, mediaMode, captionsMode, pitch) {
  const filename = `${youtubeID}-${mediaMode}-${captionsMode}${FILE_MP4}`;
  const fpath = join(DOWNLOAD_PATH, filenamify(filename, { replacement: "" }));
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
  const captionsFilename = `${captionsMode}${FILE_ASS}`;
  const inputPath =
    pitch === 0
      ? filepath(youtubeID, mediaMode, FILE_MP4)
      : filepath(youtubeID, MODE_MEDIA_PITCH, FILE_MKV);
  const outputPath = await tmp.tmpName({ postfix: FILE_MP4 });
  await execa(
    FFMPEG_PATH,
    ["-i", inputPath, "-vf", `ass=${captionsFilename}`, outputPath],
    {
      cwd: join(ROOT, youtubeID),
    }
  );
  await fs.promises.copyFile(outputPath, fpath);
  await fs.promises.unlink(outputPath);
  return fpath;
}
