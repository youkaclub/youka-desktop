const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "kkbox.com";

const provider = {
  name,
  site: "https://www.kkbox.com/",
  site_re: /https:\/\/www\.kkbox\.com\/.*\/song\/.*\.html/,

  supported: (lang) => {
    return lang === "zh";
  },

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const l = $(".lyrics")
      .text()
      .split("\n")
      .filter((line, i) => !(i < 5 && line.includes("：")))
      .join("\n")
      .trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
