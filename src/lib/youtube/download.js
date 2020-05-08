const fs = require("fs");
const tmp = require("tmp-promise");
const { ytdl } = require("../youtube-dl");

async function downloadAudio(youtubeID) {
  return download(youtubeID, ["-f", "140"]);
}

async function downloadVideo(youtubeID) {
  return download(youtubeID, ["-f", "18"]);
}

async function download(youtubeID, args) {
  args = args || [];
  const filename = await tmp.tmpName();
  args = args.concat(["--output", filename]);
  args.push(`https://www.youtube.com/watch?v=${youtubeID}`);
  await ytdl(args);
  const file = await fs.promises.readFile(filename);
  await fs.promises.unlink(filename);
  return file;
}

module.exports = {
  download,
  downloadAudio,
  downloadVideo,
};
