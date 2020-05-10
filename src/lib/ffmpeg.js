const debug = require("debug")("youka:desktop");
const os = require("os");
const fs = require("fs");
const rp = require("request-promise");
const AdmZip = require("adm-zip");
const { exists } = require("./utils");
const { FFMPEG_PATH } = require("./path");
const rollbar = require("./rollbar");
const arch = require('arch')

const FFMPEG_ZIP_PATH = `${FFMPEG_PATH}.zip`;
const platform = `${os.platform()}-${arch()}`;

const urls = {
  "win32-x86": "https://static.youka.club/binaries/ffmpeg-4.2.1-win-32.zip",
  "win32-x64": "https://static.youka.club/binaries/ffmpeg-4.2.1-win-64.zip",
  "linux-x86": "https://static.youka.club/binaries/ffmpeg-4.2.1-linux-32.zip",
  "linux-x64": "https://static.youka.club/binaries/ffmpeg-4.2.1-linux-64.zip",
  "darwin-x64": "https://static.youka.club/binaries/ffmpeg-4.2.1-osx-64.zip",
};

async function install() {
  try {
    const ex = await exists(FFMPEG_PATH);
    if (ex) return;
    debug("install ffmpeg");

    const url = urls[platform];
    if (!url) throw new Error(`unsupported platform (${platform})`);

    const zipfile = await rp({ url, encoding: null });
    await fs.promises.writeFile(FFMPEG_ZIP_PATH, zipfile);
    const zip = new AdmZip(FFMPEG_ZIP_PATH);
    let entryName
    if (platform.startsWith("win32")) {
      entryName = "ffmpeg.exe"
    } else {
      entryName = "ffmpeg"
    }
    const entry = zip.getEntry(entryName);
    if (!entry) throw new Error("Malformed ffmpeg zip file")
    const buffer = zip.readFile(entry);
    await fs.promises.writeFile(FFMPEG_PATH, buffer);
    await fs.promises.unlink(FFMPEG_ZIP_PATH);
    if (platform.startsWith("linux") || platform.startsWith("darwin")) {
      await fs.promises.chmod(FFMPEG_PATH, "755");
    }
  } catch (e) {
    rollbar.error(e);
    throw new Error("Install FFmpeg failed");
  }
}

module.exports = {
  install,
};
