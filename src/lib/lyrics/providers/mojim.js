const he = require("he");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "mojim.com";

const provider = {
  name,
  supported: (lang) => ["ja", "ko", "zh"].includes(lang),
  site: "https://mojim.com",
  site_re: /https:\/\/mojim\.com\/.*.htm/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const l = $(".fsZx3")
      .html()
      .split("<br>")
      .map((l) => l.trim())
      .filter(
        (l, i) =>
          !l.startsWith("[") &&
          !l.startsWith("<") &&
          !l.toLowerCase().includes("mojim.com") &&
          !(i < 3 && !l.toLowerCase().includes(":"))
      )
      .join("\n")
      .trim();
    return he.unescape(l);
  },
};

google.register(provider);

module.exports = provider;
