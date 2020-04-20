const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "gasazip.com";
const supported = (lang) => lang === "ko";

async function search(query) {
  const site = `https://gasazip.com/`;
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const lyricsHtml = $("#gasa").html();
  const lyrics = lyricsHtml
    .split("<br>")
    .filter((l) => l !== "")
    .join("\n");
  return lyrics;
}

module.exports = {
  name,
  supported,
  search,
};
