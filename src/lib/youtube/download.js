const ytdl = require("ytdl-core");

module.exports = async function(youtubeID, options) {
  const url = `https://www.youtube.com/watch?v=${youtubeID}`;
  return new Promise((resolve, reject) => {
    var buffers = [];
    ytdl(url, options)
      .on("data", buffer => {
        buffers.push(buffer);
      })
      .on("error", error => {
        return reject(error);
      })
      .on("finish", () => {
        var buffer = Buffer.concat(buffers);
        return resolve(buffer);
      });
  });
};
