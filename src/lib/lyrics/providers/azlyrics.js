const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "azlyrics.com";

const provider = {
  name,
  site: "https://www.azlyrics.com/lyrics/",
  site_re: /https:\/\/www\.azlyrics\.com\/lyrics\/.*\/.*.html/,
  supported: (lang) => lang === "en",

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const l = $(".col-xs-12.col-lg-8.text-center > div > br")
      .parent()
      .text()
      .split("\n")
      .filter((l) => !l.startsWith("[") && !l.startsWith("Writer(s):"))
      .join("\n")
      .trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
