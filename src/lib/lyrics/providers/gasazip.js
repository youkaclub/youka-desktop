const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "gasazip.com";
const supported = (lang) => lang === "ko";
const site = `https://gasazip.com/`;

google.register(name, site);
const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const text = $("#gasa").text().trim();
  return text;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
