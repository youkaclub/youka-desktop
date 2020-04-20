const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "lyrics.com";
const supported = (lang) => lang === "en";

async function search(query) {
  const site = "https://www.lyrics.com/lyric";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $("#lyric-body-text")
    .text()
    .split("\n")
    .filter((l) => l !== "")
    .join("\n");
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
