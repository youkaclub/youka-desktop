const debug = require("debug")("youka:youtube-dl");
const os = require("os");
const fs = require("fs");
const join = require("path").join;
const homedir = require("os").homedir();
const rp = require("request-promise");
const platform = os.platform();

const urls = {
  win32: "https://yt-dl.org/downloads/latest/youtube-dl.exe",
  darwin: "https://yt-dl.org/downloads/latest/youtube-dl",
  linux: "https://yt-dl.org/downloads/latest/youtube-dl",
};

const names = {
  win32: "youtube-dl.exe",
  darwin: "youtube-dl",
  linux: "youtube-dl",
};

const BINARIES_PATH = join(homedir, ".youka", "binaries");
const YOUTUBE_DL_PATH = join(BINARIES_PATH, names[platform]);

async function exists(filepath) {
  try {
    await fs.promises.stat(filepath);
    return true;
  } catch (e) {
    return false;
  }
}

async function install() {
  try {
    const ex = await exists(YOUTUBE_DL_PATH);
    if (ex) return;
    const url = urls[platform];
    if (!url) throw new Error("unsupported platform");
    debug("install youtube-dl");
    const ytdl = await rp({ url, encoding: null });
    await fs.promises.writeFile(YOUTUBE_DL_PATH, ytdl);
    if (platform !== "win32") {
      await fs.promises.chmod(YOUTUBE_DL_PATH, "755");
    }
  } catch (e) {
    throw new Error("Install youtube-dl failed");
  }
}

module.exports = {
  install,
  YOUTUBE_DL_PATH,
};
