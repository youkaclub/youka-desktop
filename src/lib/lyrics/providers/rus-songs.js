const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "rus-songs.ru";
const supported = (lang) => lang === "ru";
const site = "https://rus-songs.ru/";
const site_re = /https:\/\/rus-songs\.ru\/.*/;
google.register(name, site, site_re);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  $(".post-content").find("br").replaceWith("\n");
  const text = $(".post-content").text();
  return text.trim();
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
