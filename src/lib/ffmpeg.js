const ffbinaries = require("ffbinaries");
const { exists } = require("./utils");
const { BINARIES_PATH, FFMPEG_PATH } = require("./path");
const rollbar = require("./rollbar");

async function install() {
  try {
    const ex = await exists(FFMPEG_PATH);
    if (ex) return;
    await new Promise((resolve, reject) => {
      ffbinaries.downloadBinaries(
        "ffmpeg",
        { destination: BINARIES_PATH },
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  } catch (e) {
    rollbar.error(e);
    throw new Error("Install FFmpeg failed");
  }
}

module.exports = {
  install,
};
