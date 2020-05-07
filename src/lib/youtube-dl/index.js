const execa = require("execa");
const { install, YOUTUBE_DL_PATH } = require("./install");

module.exports = async function ytdl(args) {
  await install();
  try {
    await execa(YOUTUBE_DL_PATH, args);
  } catch (e) {
    throw new Error("Download from YouTube failed");
  }
};
