const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "sarkisozum.gen.tr";
const supported = () => true;
const site = "https://www.sarkisozum.gen.tr/";
google.register(name, site);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const text = $("#contentArea > div:nth-child(2) > div").text();
  return text.trim();
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
