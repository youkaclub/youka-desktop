const debug = require("debug")("youka:desktop");
const os = require("os");
const fs = require("fs");
const execa = require("execa");
const rp = require("request-promise");
const rollbar = require("./rollbar");

const { YOUTUBE_DL_PATH } = require("./path");
const { exists } = require("./utils");

const platform = os.platform();
const urls = {
  win32: "https://static.youka.club/binaries/youtube-dl.exe",
  darwin: "https://static.youka.club/binaries/youtube-dl",
  linux: "https://static.youka.club/binaries/youtube-dl",
};

async function install() {
  try {
    const ex = await exists(YOUTUBE_DL_PATH);
    if (ex) return;
    debug("install youtube-dl");

    const url = urls[platform];
    if (!url) throw new Error(`unsupported platform (${platform})`);
    const ytdl = await rp({ url, encoding: null });
    await fs.promises.writeFile(YOUTUBE_DL_PATH, ytdl);
    if (platform === "linux" || platform === "darwin") {
      await fs.promises.chmod(YOUTUBE_DL_PATH, "755");
    }
  } catch (e) {
    rollbar.error(e);
    throw new Error("Install youtube-dl failed");
  }
}

async function ytdl(args) {
  return execa(YOUTUBE_DL_PATH, args);
}

module.exports = {
  ytdl,
  install,
};
