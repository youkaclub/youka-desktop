const ytdlV2 = require("ytdl-core");
const fs = require("fs");
const tmp = require("tmp-promise");
const ytdlV1 = require("../youtube-dl").ytdl;
const rollbar = require("../rollbar");

async function downloadAudio(youtubeID) {
  return download(youtubeID, "140");
}

async function downloadVideo(youtubeID) {
  return download(youtubeID, "18");
}

async function download(youtubeID, format) {
  try {
    const fileV1 = await downloadV1(youtubeID, format);
    return fileV1;
  } catch (e) {
    rollbar.error("Download from YouTube V1 failed", e);
  }
  try {
    const fileV2 = await downloadV2(youtubeID, format);
    return fileV2;
  } catch (e) {
    rollbar.error("Download from YouTube V2 failed", e);
  }
  throw new Error("Download from YouTube failed");
}
async function downloadV1(youtubeID, format) {
  let postfix;
  switch (format) {
    case "140":
      postfix = ".m4a";
      break;
    case "18":
      postfix = ".mp4";
      break;
    default:
      break;
  }
  const filename = await tmp.tmpName({ postfix });
  const args = [
    "-v",
    "--no-check-certificate",
    "--no-cache-dir",
    "-f",
    format,
    "--output",
    filename,
    `https://www.youtube.com/watch?v=${youtubeID}`,
  ];
  await ytdlV1(args);
  const file = await fs.promises.readFile(filename);
  await fs.promises.unlink(filename);
  return file;
}

async function downloadV2(youtubeID, format) {
  const url = `https://www.youtube.com/watch?v=${youtubeID}`;
  return new Promise((resolve, reject) => {
    var buffers = [];
    ytdlV2(url, { quality: format })
      .on("data", (buffer) => {
        buffers.push(buffer);
      })
      .on("error", (error) => {
        return reject(error);
      })
      .on("finish", () => {
        var buffer = Buffer.concat(buffers);
        return resolve(buffer);
      });
  });
}

module.exports = {
  download,
  downloadAudio,
  downloadVideo,
};
