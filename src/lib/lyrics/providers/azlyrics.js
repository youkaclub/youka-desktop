const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "azlyrics.com";
const supported = (lang) => lang === "en";

async function search(query) {
  const site = "https://www.azlyrics.com/lyrics/";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $("div.col-xs-12.col-lg-8.text-center > div:nth-child(8)")
    .text()
    .split("\n")
    .filter((l) => l !== "" && !l.startsWith("["))
    .join("\n");
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
