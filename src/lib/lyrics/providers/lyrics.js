const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "lyrics.com";

const provider = {
  name,
  supported: (lang) => lang === "en",
  site: "https://www.lyrics.com/lyric",
  site_re: /https:\/\/www\.lyrics\.com\/lyric\/(\d+)\/.*\/.*/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const l = $("#lyric-body-text").text().trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
