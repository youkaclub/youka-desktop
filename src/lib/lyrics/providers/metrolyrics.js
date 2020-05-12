const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "metrolyrics.com";
const supported = () => true;
const site = "https://www.metrolyrics.com/";
const site_re = /https:\/\/www\.metrolyrics\.com\/.*\.html/;
google.register(name, site, site_re);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  let text = "";
  $(".verse").each((i, el) => {
    text += $(el).text() + "\n\n";
  });
  return text.trim();
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
