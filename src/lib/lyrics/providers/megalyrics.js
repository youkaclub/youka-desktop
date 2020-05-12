const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "megalyrics.ru";
const supported = (lang) => lang === "ru";
const site = "http://www.megalyrics.ru/lyric/";
google.register(name, site);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  $(".text_inner").find("br").replaceWith("\n");
  const text = $(".text_inner").text().trim();
  return text;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
