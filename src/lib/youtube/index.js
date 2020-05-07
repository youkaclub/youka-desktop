const mix = require("./mix");
const playlist = require("./playlist");
const search = require("./search");
const info = require("./info");
const trending = require("./trending");
const utils = require("./utils");
const { download, downloadAudio, downloadVideo } = require("./download");

module.exports = {
  mix,
  playlist,
  search,
  download,
  downloadAudio,
  downloadVideo,
  info,
  trending,
  utils,
};
