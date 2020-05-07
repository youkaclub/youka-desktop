const execa = require("execa");
const install = require("./install");
const YOUTUBE_DL_PATH = require("../library").YOUTUBE_DL_PATH;

module.exports = async function ytdl(args) {
  await install();
  await execa(YOUTUBE_DL_PATH, args);
};
