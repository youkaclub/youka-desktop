const needle = require("needle");
const rp = require("request-promise");
const config = require("../config");

export async function getDownload(youtubeID, files) {
  const urls = files.map(
    (file) => `${config.api}/download/${youtubeID}/${file.name}${file.ext}`
  );
  const promises = urls.map((url) => rp(url, { encoding: null }));
  const buffers = await Promise.all(promises);
  files.map((file, i) => (file.buffer = buffers[i]));
  return files;
}

export async function getSplitAlign(youtubeID) {
  const url = `${config.api}/split-align-queue-result-v2/${youtubeID}`;

  for (let i = 0; i < 100; i++) {
    const response = await rp(url, { json: true });
    if (response) {
      return response;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error("Server timeout");
}

export async function postSplitAlign(youtubeID, audio, lyrics, language) {
  if (!youtubeID) throw new Error("youtubeID is empty");
  if (!audio) throw new Error("audio is empty");

  const url = `${config.api}/split-align-queue/${youtubeID}`;

  let data = {};

  data.audio = {
    buffer: audio,
    filename: "audio",
    content_type: "application/octet-stream",
  };

  if (lyrics) {
    data.lang = language;
    data.transcript = {
      buffer: Buffer.from(lyrics, "utf8"),
      filename: "transcript",
      content_type: "application/octet-stream",
    };
  }

  const response = await needle("post", url, data, {
    multipart: true,
    user_agent: "Youka",
  });

  if (response.statusCode !== 204) {
    throw new Error(
      "The server is too busy at the moment. please try again later"
    );
  }
}
