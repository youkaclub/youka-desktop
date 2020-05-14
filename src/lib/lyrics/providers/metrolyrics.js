const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "metrolyrics.com";

const provider = {
  name,
  supported: () => true,
  site: "https://www.metrolyrics.com/",
  site_re: /https:\/\/www\.metrolyrics\.com\/.*\.html/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    let text = "";
    $(".verse").each((i, el) => {
      text += $(el).text() + "\n\n";
    });
    return text.trim();
  },
};

google.register(provider);

module.exports = provider;
