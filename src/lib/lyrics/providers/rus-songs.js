const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "rus-songs.ru";

const provider = {
  name,
  supported: (lang) => lang === "ru",
  site: "https://rus-songs.ru/",
  site_re: /https:\/\/rus-songs\.ru\/.*/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    $(".post-content").find("br").replaceWith("\n");
    const text = $(".post-content").text();
    return text.trim();
  },
};

google.register(provider);

module.exports = provider;
