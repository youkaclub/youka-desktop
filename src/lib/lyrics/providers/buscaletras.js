const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "buscaletras.com";
const supported = (lang) => lang === "es";

async function search(query) {
  const site = "https://www.buscaletras.com/";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $(".inner-content-block")
    .text()
    .trim()
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
