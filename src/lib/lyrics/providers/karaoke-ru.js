const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "karaoke.ru";
const supported = (lang) => lang === "ru";
const site = "https://www.karaoke.ru/artists/*/text/";
const site_re = /https:\/\/www\.karaoke\.ru\/artists\/.*\/text\/.*/;
google.register(name, site, site_re);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const text = $(".song-text").text();
  return text.trim();
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
