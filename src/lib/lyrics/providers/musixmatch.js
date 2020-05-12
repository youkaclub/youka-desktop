const rp = require("./request-promise");
const cheerio = require("cheerio");
const google = require("./google_site");

const name = "musixmatch.com";
const supported = () => true;
const site = "https://www.musixmatch.com/lyrics";
const site_re = /https:\/\/www\.musixmatch\.com\/lyrics\//;
google.register(name, site, site_re);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  let text = "";
  $("span.lyrics__content__ok").each((i, el) => {
    text += $(el).text();
  });
  return text.trim();
}

module.exports = {
  name,
  search,
  lyrics,
  supported,
};
