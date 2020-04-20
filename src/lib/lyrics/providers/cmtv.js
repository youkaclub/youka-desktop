const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "cmtv.com.ar";
const supported = (lang) => lang === "es";

async function search(query) {
  const site = "https://www.cmtv.com.ar/discos_letras/letra.php";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $("main p")
    .html()
    .split("<br>")
    .map((l) => l.trim())
    .filter((l) => l !== "")
    .join("\n");
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
