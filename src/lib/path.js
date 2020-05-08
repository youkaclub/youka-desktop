const os = require("os");
const platform = os.platform();
const join = require("path").join;
const homedir = require("os").homedir();
const BINARIES_PATH = join(homedir, ".youka", "binaries");
const ROOT = join(homedir, ".youka", "youtube");
const FFMPEG_PATH = join(BINARIES_PATH, "ffmpeg");

const ytdlNames = {
  win32: "youtube-dl.exe",
  darwin: "youtube-dl",
  linux: "youtube-dl",
};
const YOUTUBE_DL_PATH = join(BINARIES_PATH, ytdlNames[platform]);

module.exports = {
  ROOT,
  BINARIES_PATH,
  FFMPEG_PATH,
  YOUTUBE_DL_PATH,
};
