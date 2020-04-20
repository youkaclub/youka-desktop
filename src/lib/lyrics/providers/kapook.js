const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "kapook.com";
const supported = (lang) => lang === "th";

async function search(query) {
  const site = "https://musicstation.kapook.com/";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $("tbody p")
    .text()
    .split("\n")
    .filter((l) => l.trim() !== "")
    .join("\n");
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
