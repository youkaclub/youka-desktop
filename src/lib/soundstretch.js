const debug = require("debug")("youka:desktop");
const os = require("os");
const fs = require("fs");
const rp = require("request-promise");

const { SOUND_STRETCH_PATH } = require("./path");
const { exists } = require("./utils");

const platform = os.platform();
const urls = {
  win32: "https://static.youka.club/binaries/soundstretch.exe",
  darwin: "https://static.youka.club/binaries/soundstretch",
};

async function install() {
  const url = urls[platform];
  if (!url) return;
  const ex = await exists(SOUND_STRETCH_PATH);
  if (ex) {
    return;
  }
  debug("install soundstretch");
  const buffer = await rp({ url, encoding: null });
  await fs.promises.writeFile(SOUND_STRETCH_PATH, buffer);
  if (platform === "darwin") {
    await fs.promises.chmod(SOUND_STRETCH_PATH, "755");
  }
}

module.exports = {
  install,
};
