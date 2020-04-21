const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "mojim.com";
const supported = (lang) => ["ja", "ko", "zh"].includes(lang);

async function search(query) {
  const site = "https://mojim.com";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $(".fsZx3")
    .html()
    .split("<br>")
    .map((l) => l.trim())
    .filter(
      (l, i) =>
        l !== "" &&
        !l.startsWith("[") &&
        !l.startsWith("<") &&
        !l.toLowerCase().includes("mojim.com") &&
        !(i < 3 && !l.toLowerCase().includes(":"))
    )
    .join("\n");
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
