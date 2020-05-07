const ytdl = require("ytdl-core");

module.exports = async function(youtubeID) {
  const url = `https://www.youtube.com/watch?v=${youtubeID}`;
  const info = await ytdl.getBasicInfo(url);
  return info;
};
