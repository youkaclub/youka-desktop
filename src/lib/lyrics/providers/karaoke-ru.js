const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "karaoke.ru";

const provider = {
  name,
  supported: (lang) => lang === "ru",
  site: "https://www.karaoke.ru/artists/*/text/",
  site_re: /https:\/\/www\.karaoke\.ru\/artists\/.*\/text\/.*/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const text = $(".song-text").text();
    return text.trim();
  },
};

google.register(provider);

module.exports = provider;
