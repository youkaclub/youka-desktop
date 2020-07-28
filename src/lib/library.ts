import fs from "fs";
import { join } from "path";
import mkdirp from "mkdirp";
import execa from "execa";
import rp from "request-promise";
import checkDiskSpace from "check-disk-space";
import filenamify from "filenamify";

import lyricsFinder from "./lyrics";
import gt from "./google-translate";
import { alignmentsFromJSON, Alignment } from "./alignment";
import { alignmentsToAss } from "./ass-alignment";
import rollbar from "./rollbar";
import youtube from "./youtube";
import youtubeDL from "./youtube-dl";
import ffmpegi from "./ffmpeg";
import soundstretch from "./soundstretch";
import { exists } from "./utils";
import {
  HOME_PATH,
  ROOT,
  FFMPEG_PATH,
  BINARIES_PATH,
  DOWNLOAD_PATH,
  SOUND_STRETCH_PATH,
  FONTS_PATH,
} from "./path";

export enum FileType {
  MP4 = ".mp4",
  MP3 = ".mp3",
  M4A = ".m4a",
  WAV = ".wav",
  MKV = ".mkv",
  ASS = ".ass",
  VTT = ".vtt",
  TEXT = ".txt",
  JSON = ".json",
  JPEG = ".jpeg",
}

export enum MediaMode {
  Video = "video",
  Original = "original",
  Instruments = "instruments",
  Vocals = "vocals",
  Pitch = "pitch",
  Image = "image",
}

export enum CaptionsMode {
  Line = "line",
  Word = "word",
  Full = "full",
  Off = "off",
}

export enum MetadataMode {
  Lyrics = "lyrics",
  Info = "info",
  Lang = "lang",
}

export type Mode = MediaMode | CaptionsMode | MetadataMode;

export type MediaUrls = Partial<Record<MediaMode, string>>;
export type CaptionUrls = Partial<Record<CaptionsMode, string>>;

export interface Info {
  title: string;
}

const LANG_TO_FONT: Record<string, string> = {
  ko: "ko.otf",
  ja: "ja.otf",
  zh: "zh.otf",
  ar: "ar.ttf",
  th: "th.ttf",
  hi: "hi.ttf",
};

export async function font(lang: string) {
  const fontFile = LANG_TO_FONT[lang];
  if (!fontFile) return;

  const fpath = join(FONTS_PATH, fontFile);
  if (!(await exists(fpath))) {
    await mkdirp(FONTS_PATH);
    const font = await rp({
      url: `https://static.youka.club/fonts/${fontFile}`,
      encoding: null,
    });
    await fs.promises.writeFile(fpath, font);
  }

  return `file://${fpath}`;
}

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
    const fpath = filepath(id, MediaMode.Instruments, FileType.MP4);
    if (!(await exists(fpath))) {
      continue;
    }
    const inf = await getInfo(id);
    if (inf) {
      const imgpath = filepath(id, MediaMode.Image, FileType.JPEG);
      let imgurl = fileurl(id, MediaMode.Image, FileType.JPEG);
      if (!(await exists(imgpath))) {
        const uri = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        try {
          const image = await rp({
            uri,
            encoding: null,
          });
          await fs.promises.writeFile(imgpath, image);
        } catch (e) {
          rollbar.error(e);
          imgurl = uri;
        }
      }
      items.push({
        id: id,
        image: imgurl,
        title: youtube.utils.cleanTitle(inf.title),
      });
    }
  }

  return items;
}

export function filepath(youtubeID: string, mode: Mode, file: FileType) {
  return join(ROOT, youtubeID, `${mode}${file}`);
}

export function fileurl(youtubeID: string, mode: Mode, file: FileType) {
  // replace backslash with forward slash to correctly render Windows paths as file URLs
  const fpath = [ROOT.replace(/\\/g, "/"), youtubeID, `${mode}${file}`].join(
    "/"
  );
  return `file://${fpath}`;
}

export async function isLoaded(youtubeID: string): Promise<boolean> {
  const fpath = filepath(youtubeID, MediaMode.Instruments, FileType.MP4);
  if (!(await exists(fpath))) {
    return false;
  }

  return true;
}

export async function files(
  youtubeID: string
): Promise<{ videos: MediaUrls; captions: CaptionUrls } | undefined> {
  if (!(await isLoaded(youtubeID))) {
    return undefined;
  }

  const videos: Partial<Record<MediaMode, string>> = {};
  const captions: Partial<Record<CaptionsMode, string>> = {};
  const files = await fs.promises.readdir(join(ROOT, youtubeID));
  for (const file of files) {
    const parts = file.split(".");
    const mode = parts[0];
    const ext = "." + parts[1];

    switch (ext) {
      case FileType.MP4:
        if (
          mode === MediaMode.Instruments ||
          mode === MediaMode.Original ||
          mode === MediaMode.Vocals
        ) {
          const fvurl = fileurl(youtubeID, mode, FileType.MP4);
          if (fvurl) {
            videos[mode] = fvurl;
          }
        }
        break;
      case FileType.JSON:
        if (mode === CaptionsMode.Line || mode === CaptionsMode.Word) {
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
      case FileType.VTT:
        const fcurl = fileurl(youtubeID, mode as CaptionsMode, ext);
        if (fcurl && !(mode in captions)) {
          captions[mode as CaptionsMode] = fcurl;
        }
        break;
      default:
        break;
    }
  }

  return { videos, captions };
}

async function validateDiskSpace(): Promise<void> {
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

export async function init(youtubeID: string): Promise<void> {
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
}

export async function getAudio(
  youtubeID: string,
  mode: Mode
): Promise<Buffer | undefined> {
  const fp = filepath(youtubeID, mode, FileType.M4A);
  if (await exists(fp)) {
    return fs.promises.readFile(fp);
  }

  if (mode === MediaMode.Original) {
    const audio = await youtube.downloadAudio(youtubeID);
    await fs.promises.writeFile(fp, audio);
    return audio;
  }
}

export async function getVideo(youtubeID: string, mode: Mode): Promise<Buffer> {
  const cwd = join(ROOT, youtubeID);
  const inputMP4 = `${MediaMode.Video}${FileType.MP4}`;
  const inputM4A = `${mode}${FileType.M4A}`;
  const output = `${mode}${FileType.MP4}`;
  const outputFull = join(cwd, output);

  if (await exists(outputFull)) {
    return fs.promises.readFile(outputFull);
  }

  if (mode === MediaMode.Video) {
    const video = await youtube.downloadVideo(youtubeID);
    await fs.promises.writeFile(outputFull, video);
    return video;
  }

  await execa(
    FFMPEG_PATH,
    [
      "-y",
      "-i",
      inputMP4,
      "-i",
      inputM4A,
      "-vcodec",
      "copy",
      "-acodec",
      "copy",
      "-map",
      "0:0",
      "-map",
      "1:0",
      output,
    ],
    { cwd }
  );

  return fs.promises.readFile(outputFull);
}

export async function setLyrics(
  youtubeID: string,
  lyrics: string
): Promise<void> {
  const fp = filepath(youtubeID, MetadataMode.Lyrics, FileType.TEXT);
  return fs.promises.writeFile(fp, lyrics, "utf8");
}

export async function getLyrics(
  youtubeID: string,
  title?: string
): Promise<string | undefined> {
  const fp = filepath(youtubeID, MetadataMode.Lyrics, FileType.TEXT);
  if (await exists(fp)) {
    const l = await fs.promises.readFile(fp, "utf8");
    if (l.trim() === "" || l === "undefined" || l === "null") return undefined;
    return l;
  }
  const lyrics = await lyricsFinder(title);
  await fs.promises.writeFile(fp, lyrics, "utf8");

  return lyrics;
}

export async function getInfo(youtubeID: string): Promise<Info> {
  const fp = filepath(youtubeID, MetadataMode.Info, FileType.JSON);
  if (await exists(fp)) {
    const data = await fs.promises.readFile(fp);
    return JSON.parse(data.toString());
  }
  const info = (await youtube.info(youtubeID)) || {};
  await fs.promises.writeFile(fp, JSON.stringify(info, null, 2), "utf8");
  return info;
}

export async function getLanguage(
  youtubeID: string,
  language?: string,
  force: boolean = false
): Promise<string | undefined> {
  try {
    const fp = filepath(youtubeID, MetadataMode.Lang, FileType.TEXT);
    if (!force && (await exists(fp))) {
      return fs.promises.readFile(fp, "utf8");
    }
    const lang = await gt.language(language);
    await fs.promises.writeFile(fp, lang);
    return lang;
  } catch (e) {
    rollbar.error(e);
    return undefined;
  }
}

export async function getAlignments(
  youtubeID: string,
  mode: Mode
): Promise<Alignment[]> {
  const fpath = filepath(youtubeID, mode, FileType.JSON);
  if (await exists(fpath)) {
    const alignments = JSON.parse(await fs.promises.readFile(fpath, "utf-8"));
    return alignments;
  }
  return [];
}

export async function setAlignments(
  youtubeID: string,
  mode: Mode,
  alignments: Alignment[]
) {
  const fpath = filepath(youtubeID, mode, FileType.JSON);
  await fs.promises.writeFile(
    fpath,
    JSON.stringify(alignments, null, 2),
    "utf-8"
  );
}

export async function getTitle(youtubeID: string): Promise<string> {
  const info = await getInfo(youtubeID);
  return youtube.utils.cleanTitle(info.title);
}

export async function saveFile(
  youtubeID: string,
  mode: Mode,
  file: FileType,
  buffer: Buffer
): Promise<void> {
  const fp = filepath(youtubeID, mode, file);
  return fs.promises.writeFile(fp, buffer);
}

export async function getWav(
  youtubeID: string,
  mediaMode: MediaMode
): Promise<string> {
  const cwd = join(ROOT, youtubeID);
  const output = `${mediaMode}${FileType.WAV}`;
  const outputFull = join(cwd, output);
  if (await exists(outputFull)) return outputFull;
  const input = `${mediaMode}${FileType.M4A}`;
  await execa(
    FFMPEG_PATH,
    ["-y", "-i", input, "-acodec", "pcm_s16le", output],
    {
      cwd,
    }
  );
  return outputFull;
}

export async function getPitch(
  youtubeID: string,
  mediaMode: MediaMode,
  n: number
) {
  if (n === 0) {
    return fileurl(youtubeID, mediaMode, FileType.MP4);
  }
  await soundstretch.install();

  const cwd = join(ROOT, youtubeID);
  const output = `${MediaMode.Pitch}${FileType.MKV}`;
  const inputMP4 = `${MediaMode.Original}${FileType.MP4}`;
  const modeWAV = `${mediaMode}${FileType.WAV}`;
  const pitchWAV = `${MediaMode.Pitch}${FileType.WAV}`;
  const outputFull = join(cwd, output);
  await getWav(youtubeID, mediaMode);

  await execa(SOUND_STRETCH_PATH, [modeWAV, pitchWAV, `-pitch=${n}`], { cwd });

  await execa(
    FFMPEG_PATH,
    [
      "-y",
      "-i",
      inputMP4,
      "-i",
      pitchWAV,
      "-map",
      "0:0",
      "-map",
      "1:0",
      "-vcodec",
      "copy",
      "-acodec",
      "copy",
      output,
    ],
    { cwd }
  );

  const url = `file://${outputFull}`;
  return url;
}

export async function download(
  youtubeID: string,
  mediaMode: MediaMode,
  captionsMode: CaptionsMode,
  file: FileType,
  pitch: number
) {
  await init(youtubeID);

  if (file === FileType.MP3) {
    return downloadAudio(youtubeID, mediaMode, pitch);
  } else if (file === FileType.MP4) {
    return downloadVideo(youtubeID, mediaMode, captionsMode, pitch);
  }
}

export async function downloadAudio(
  youtubeID: string,
  mediaMode: MediaMode,
  pitch: number
) {
  let input;
  let output;
  if (pitch === 0) {
    input = `${mediaMode}${FileType.M4A}`;
    output = filenamify(`youka-${youtubeID}-${mediaMode}${FileType.MP3}`, {
      replacement: "",
    });
  } else {
    await getPitch(youtubeID, mediaMode, pitch);
    input = `${MediaMode.Pitch}${FileType.WAV}`;
    const pitchStr = pitch > 0 ? `key-plus-${pitch}` : `key-minus${pitch}`;
    output = filenamify(
      `youka-${youtubeID}-${mediaMode}-${pitchStr}${FileType.MP3}`,
      {
        replacement: "",
      }
    );
  }

  const cwd = join(ROOT, youtubeID);
  const outputFull = join(cwd, output);
  const downloadFull = join(DOWNLOAD_PATH, output);

  await execa(
    FFMPEG_PATH,
    ["-y", "-i", input, "-acodec", "libmp3lame", "-b", "320", output],
    { cwd }
  );

  await fs.promises.copyFile(outputFull, downloadFull);
  await fs.promises.unlink(outputFull);

  return downloadFull;
}

export async function downloadVideo(
  youtubeID: string,
  mediaMode: MediaMode,
  captionsMode: CaptionsMode,
  pitch: number
) {
  let input;
  let output;
  if (pitch === 0) {
    input = `${mediaMode}${FileType.MP4}`;
    output = filenamify(
      `youka-${youtubeID}-${mediaMode}-${captionsMode}${FileType.MP4}`,
      { replacement: "" }
    );
  } else {
    await getPitch(youtubeID, mediaMode, pitch);
    input = `${MediaMode.Pitch}${FileType.MKV}`;
    const pitchStr = pitch > 0 ? `key-plus-${pitch}` : `key-minus${pitch}`;
    output = filenamify(
      `youka-${youtubeID}-${mediaMode}-${captionsMode}-${pitchStr}${FileType.MP4}`,
      { replacement: "" }
    );
  }

  const cwd = join(ROOT, youtubeID);
  const downloadFile = output;
  const downloadFull = join(DOWNLOAD_PATH, downloadFile);
  const alignmentsFull = filepath(youtubeID, captionsMode, FileType.JSON);
  const modeFull = filepath(youtubeID, mediaMode, FileType.MP4);
  const captionsFull = filepath(youtubeID, captionsMode, FileType.ASS);
  const outputFull = join(cwd, output);
  const captionsFile = `${captionsMode}${FileType.ASS}`;

  if (!(await exists(alignmentsFull))) {
    await fs.promises.copyFile(modeFull, downloadFull);
    return downloadFull;
  }

  const json = await fs.promises.readFile(alignmentsFull, "utf-8");
  const alignments = alignmentsFromJSON(json);
  const ass = alignmentsToAss(alignments);

  await fs.promises.writeFile(captionsFull, ass, "utf-8");

  await execa(
    FFMPEG_PATH,
    ["-y", "-i", input, "-vf", `ass=${captionsFile}`, output],
    { cwd }
  );

  await fs.promises.copyFile(outputFull, downloadFull);
  await fs.promises.unlink(outputFull);

  return downloadFull;
}
