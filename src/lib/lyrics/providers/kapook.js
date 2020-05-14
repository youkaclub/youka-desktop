const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "kapook.com";

const provider = {
  name,
  supported: (lang) => lang === "th",
  site: "https://musicstation.kapook.com/",
  site_re: /https:\/\/musicstation.kapook.com\/.*/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const l = $("tbody p").text().trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
