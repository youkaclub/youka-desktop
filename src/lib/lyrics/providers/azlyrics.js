const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "azlyrics.com";
const supported = (lang) => lang === "en";
const site = "https://www.azlyrics.com/lyrics/";

google.register(name, site);
const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $(".col-xs-12.col-lg-8.text-center > div > br")
    .parent()
    .text()
    .split("\n")
    .filter((l) => !l.startsWith("[") && !l.startsWith("Writer(s):"))
    .join("\n")
    .trim();
  return l;
}

module.exports = {
  name,
  supported,
  search,
  lyrics,
};
