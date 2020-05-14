const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "buscaletras.com";

const provider = {
  name,
  site: "https://www.buscaletras.com/",
  site_re: /https:\/\/www\.buscaletras\.com\/.*\/.*/,
  supported: (lang) => lang === "es",

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    let text = "";
    $(".primary .entry-content p").each((i, el) => {
      text += $(el).text().trim() + "\n\n";
    });
    return text.trim();
  },
};

google.register(provider);

module.exports = provider;
