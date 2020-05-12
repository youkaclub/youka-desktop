const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "lyricsmint.com";
const supported = (lang) => ["hi", "pa", "en"].includes(lang);
const site = "https://www.lyricsmint.com/";
const site_re = /https:\/\/www\.lyricsmint\.com\/.*\/.*/;
google.register(name, site, site_re);
const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  $("div.pt-4.pb-2 > .text-base").find("br").replaceWith("\n");
  const l = $("div.pt-4.pb-2 > .text-base").text().trim();
  return l;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
