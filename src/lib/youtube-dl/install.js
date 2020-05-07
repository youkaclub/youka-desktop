const debug = require("debug")("youka:youtube-dl");
const os = require("os");
const fs = require("fs");
const rp = require("request-promise");
const { YOUTUBE_DL_PATH, exists } = require("../library");
const platform = os.platform();

const urls = {
  win32: "https://yt-dl.org/downloads/latest/youtube-dl.exe",
  darwin: "https://yt-dl.org/downloads/latest/youtube-dl",
  linux: "https://yt-dl.org/downloads/latest/youtube-dl",
};

async function shouldInstall() {
  if (!(await exists(YOUTUBE_DL_PATH))) return true;
  const stat = await fs.promises.stat(YOUTUBE_DL_PATH);
  const differentDays = Math.ceil((Date() - stat.mtime) / (1000 * 3600 * 24));
  if (differentDays > 7) return true;

  return false;
}

async function install() {
  if (!(await shouldInstall())) return;
  const url = urls[platform];
  if (!url) throw new Error("unsupported platform");
  debug("install youtube-dl");
  const ytdl = await rp({ url, encoding: null });
  await fs.promises.writeFile(YOUTUBE_DL_PATH, ytdl);
  await fs.promises.chmod(YOUTUBE_DL_PATH, "755");
}

module.exports = install;
