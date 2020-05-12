const he = require("he");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "mojim.com";
const supported = (lang) => ["ja", "ko", "zh"].includes(lang);
const site = "https://mojim.com";
const site_re = /https:\/\/mojim\.com\/.*.htm/;
google.register(name, site, site_re);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $(".fsZx3")
    .html()
    .split("<br>")
    .map((l) => l.trim())
    .filter(
      (l, i) =>
        !l.startsWith("[") &&
        !l.startsWith("<") &&
        !l.toLowerCase().includes("mojim.com") &&
        !(i < 3 && !l.toLowerCase().includes(":"))
    )
    .join("\n")
    .trim();
  return he.unescape(l);
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
