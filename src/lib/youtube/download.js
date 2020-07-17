const ytdlV2 = require("ytdl-core");
const fs = require("fs");
const tmp = require("tmp-promise");
const ytdlV1 = require("../youtube-dl").ytdl;
const rollbar = require("../rollbar");

const MODE_AUDIO = "audio";
const MODE_VIDEO = "video";

async function downloadAudio(youtubeID) {
  return download(youtubeID, MODE_AUDIO);
}

async function downloadVideo(youtubeID) {
  return download(youtubeID, MODE_VIDEO);
}

async function download(youtubeID, mode) {
  try {
    const fileV1 = await downloadV1(youtubeID, mode);
    return fileV1;
  } catch (e) {
    rollbar.warn("Download from YouTube V1 failed", e);
  }
  try {
    const fileV2 = await downloadV2(youtubeID, mode);
    return fileV2;
  } catch (e) {
    rollbar.warn("Download from YouTube V2 failed", e);
  }
  throw new Error("Download from YouTube failed");
}
async function downloadV1(youtubeID, mode) {
  let postfix;
  let format;
  switch (mode) {
    case MODE_AUDIO:
      postfix = ".m4a";
      format = "bestaudio[ext=m4a]";
      break;
    case MODE_VIDEO:
      postfix = ".mp4";
      format = "bestvideo[ext=mp4]";
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

async function downloadV2(youtubeID, mode) {
  let quality;
  switch (mode) {
    case MODE_AUDIO:
      quality = "highestaudio";
      break;
    case MODE_VIDEO:
      quality = "highestvideo";
      break;
    default:
      break;
  }

  const url = `https://www.youtube.com/watch?v=${youtubeID}`;
  return new Promise((resolve, reject) => {
    var buffers = [];
    ytdlV2(url, { quality })
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
