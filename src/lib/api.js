const needle = require("needle");
const rp = require("request-promise");
const config = require("../config");

export async function getSplitAlign(youtubeID) {
  const url = `${config.api}/split-align-queue-result/${youtubeID}`;

  for (let i = 0; i < 100; i++) {
    const response = await rp(url, { json: true });
    if (response && response.audio) {
      return { audio: response.audio, captions: response.captions };
    }
    await new Promise((r) => setTimeout(r, 5000));
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
