const join = require("path").join;
const homedir = require("os").homedir();
const execa = require("execa");
const install = require("./install");
const BINARIES_PATH = join(homedir, ".youka", "binaries");
const YOUTUBE_DL_PATH = join(BINARIES_PATH, "youtube-dl");

module.exports = async function ytdl(args) {
  await install();
  try {
    await execa(YOUTUBE_DL_PATH, args);
  } catch (e) {
    throw new Error("Download from YouTube failed");
  }
};
