const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "lyricsmint.com";
const supported = (lang) => ["hi", "pa", "en"].includes(lang);

async function search(query) {
  const site = "https://www.lyricsmint.com/";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const lyricsHTML = $(".container .text-base").html();
  const parts = lyricsHTML.split("</span>");
  if (parts.length !== 2) return;
  const lines = parts[1].split("<br>").filter((line) => line !== "");
  return lines.join("\n");
}

module.exports = {
  name,
  supported,
  search,
};
