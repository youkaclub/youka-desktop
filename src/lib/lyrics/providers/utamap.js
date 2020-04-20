const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "utamap.com";
const supported = (lang) => lang === "ja";

async function search(query) {
  const site = "http://www.utamap.com/showkasi.php";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $(".kasi_honbun")
    .html()
    .split("<br>")
    .filter((l) => l !== "" && !l.includes("<!--"))
    .join("\n");
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
