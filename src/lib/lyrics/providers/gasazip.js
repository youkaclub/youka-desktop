const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "gasazip.com";

const provider = {
  name,
  site: `https://gasazip.com/`,
  site_re: /https:\/\/gasazip\.com\/\d+/,
  supported: (lang) => lang === "ko",

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const text = $("#gasa").text().trim();
    return text;
  },
};

google.register(provider);

module.exports = provider;
