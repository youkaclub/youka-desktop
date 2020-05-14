const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "sarkisozum.gen.tr";

const provider = {
  name,
  supported: (lang) => lang === "tr",
  site: "https://www.sarkisozum.gen.tr/",
  site_re: /https:\/\/www\.sarkisozum\.gen\.tr\/.*-lyrics/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const text = $("#contentArea > div:nth-child(2) > div").text();
    return text.trim();
  },
};

google.register(provider);

module.exports = provider;
