const rp = require("request-promise");

const name = "genius.com";
const supported = () => true;

const headers = {
  Host: "api.genius.com",
  Accept: "*/*",
  "Content-Type": "application/json",
  "X-Genius-iOS-Version": "6.0.6",
  "User-Agent": "Genius/825 CFNetwork/1121.2.2 Darwin/19.2.0",
};

async function search(query) {
  const searchResp = await searchMulti(query, 3);
  const songID = songFromSearch(searchResp);
  const url = `https://api.genius.com/songs/${songID}?text_format=plain`;
  return url;
}

async function lyrics(url) {
  const options = {
    uri: url,
    headers,
    json: true,
  };
  const songResp = await rp(options);
  const lyrics = cleanLyrics(lyricsFromSong(songResp));
  return lyrics;
}

async function searchMulti(query, perPage) {
  const options = {
    uri: `https://api.genius.com/search/multi?q=${encodeURIComponent(
      query
    )}&per_page=${perPage}`,
    headers,
    json: true,
  };
  return rp(options);
}

function songFromSearch(result) {
  const section = result.response.sections.find((s) => s.type === "top_hit");
  const hit = section.hits.find((h) => h.type === "song");
  if (hit) return hit.result.id;
}

function lyricsFromSong(result) {
  return result.response.song.lyrics.plain;
}

function cleanLyrics(lyrics) {
  const lines = [];
  lyrics.split("\n").map((line) => {
    line = line.trim();
    if (line.startsWith("[") && line.endsWith("]")) return null;
    if (line.startsWith("{") && line.endsWith("}")) return null;
    lines.push(line);
    return null;
  });

  return lines.join("\n");
}

module.exports = {
  name,
  supported,
  search,
  lyrics,
};
