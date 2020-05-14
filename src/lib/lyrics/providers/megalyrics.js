const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "megalyrics.ru";

const provider = {
  name,
  supported: (lang) => lang === "ru",
  site: "http://www.megalyrics.ru/lyric/",
  site_re: /http:\/\/www\.megalyrics\.ru\/lyric\/.*\/.*\.htm/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    $(".text_inner").find("br").replaceWith("\n");
    const text = $(".text_inner").text().trim();
    return text;
  },
};

google.register(provider);

module.exports = provider;
