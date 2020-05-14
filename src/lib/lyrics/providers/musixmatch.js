const rp = require("./request-promise");
const cheerio = require("cheerio");
const google = require("./google_site");

const name = "musixmatch.com";

const provider = {
  name,
  supported: () => true,
  site: "https://www.musixmatch.com/lyrics",
  site_re: /https:\/\/www\.musixmatch\.com\/lyrics\//,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    let text = "";
    $(".mxm-lyrics__content").each((i, el) => {
      text += $(el).text();
    });
    return text.trim();
  },
};

google.register(provider);

module.exports = provider;
