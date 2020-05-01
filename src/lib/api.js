const needle = require("needle");
const config = require("../config");

export async function getSplitAlign(
  youtubeID,
  audio,
  lyrics,
  language,
  upload
) {
  const url = `${config.api}/split-align`;
  let data = {};

  if (audio) {
    data.audio = {
      buffer: audio,
      filename: "audio",
      content_type: "application/octet-stream",
    };
  } else if (!upload && youtubeID) {
    data["youtube-id"] = youtubeID;
  } else {
    throw new Error("audio and youtube-id is missing");
  }

  if (lyrics) {
    data.transcript = {
      buffer: Buffer.from(lyrics, "utf8"),
      filename: "transcript",
      content_type: "application/octet-stream",
    };
  }
  if (language) {
    data["lang"] = language;
  }

  const response = await needle("post", url, data, {
    multipart: true,
    user_agent: "Youka",
  });
  if (response.statusCode !== 200) {
    const message = response.body.message || "split failed";
    throw new Error(message);
  }
  if (!response.body.audio && !response.body.captions) {
    throw new Error("split failed");
  }

  return response.body;
}
