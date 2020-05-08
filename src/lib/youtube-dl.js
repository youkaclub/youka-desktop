const debug = require("debug")("youka:youtube-dl");
const os = require("os");
const fs = require("fs");
const execa = require("execa");
const rp = require("request-promise");

const { YOUTUBE_DL_PATH } = require("./path");
const { exists } = require("./utils");

const platform = os.platform();
const urls = {
  win32: "https://yt-dl.org/downloads/latest/youtube-dl.exe",
  darwin: "https://yt-dl.org/downloads/latest/youtube-dl",
  linux: "https://yt-dl.org/downloads/latest/youtube-dl",
};

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

async function ytdl(args) {
  try {
    await execa(YOUTUBE_DL_PATH, args);
  } catch (e) {
    throw new Error("Download from YouTube failed");
  }
}

module.exports = {
  ytdl,
  install,
};
