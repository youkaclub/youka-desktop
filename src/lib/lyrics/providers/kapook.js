const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "kapook.com";
const supported = (lang) => lang === "th";
const site = "https://musicstation.kapook.com/";
const site_re = /https:\/\/musicstation.kapook.com\/.*/;
google.register(name, site, site_re);
const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const l = $("tbody p").text().trim();
  return l;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
