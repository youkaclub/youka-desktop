const debug = require("debug")("youka:desktop");
const os = require("os");
const fs = require("fs");
const execa = require("execa");
const rp = require("request-promise");

const { YOUTUBE_DL_PATH, MSVCR_PATH } = require("./path");
const { exists } = require("./utils");

const platform = os.platform();
const urls = {
  win32: "https://static.youka.club/binaries/youtube-dl.exe",
  darwin: "https://static.youka.club/binaries/youtube-dl",
  linux: "https://static.youka.club/binaries/youtube-dl",
};

const msvcrURL = "http://static.youka.club/binaries/msvcr100.dll";

async function install() {
  if (platform === "win32" && !(await exists(MSVCR_PATH))) {
    const buffer = await rp({ url: msvcrURL, encoding: null });
    await fs.promises.writeFile(MSVCR_PATH, buffer);
  }

  const ex = await exists(YOUTUBE_DL_PATH);
  if (ex) {
    return;
  }
  debug("install youtube-dl");

  const url = urls[platform];
  if (!url) throw new Error(`unsupported platform (${platform})`);
  const ytdl = await rp({ url, encoding: null });
  await fs.promises.writeFile(YOUTUBE_DL_PATH, ytdl);
  if (platform === "linux" || platform === "darwin") {
    await fs.promises.chmod(YOUTUBE_DL_PATH, "755");
  }
}

async function update() {
  try {
    debug("update youtube-dl");
    await ytdl(["-U"]);
  } catch (e) {
    console.error(e);
  }
}

async function ytdl(args) {
  return execa(YOUTUBE_DL_PATH, args);
}

module.exports = {
  ytdl,
  install,
  update,
};
