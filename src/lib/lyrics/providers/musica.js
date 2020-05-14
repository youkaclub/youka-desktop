const he = require("he");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "musica.com";

const provider = {
  name,
  supported: (lang) => lang === "es",
  site: "https://www.musica.com/letras.asp",
  site_re: /https:\/\/www\.musica\.com\/letras\.asp\?letra=\d+/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    let text = "";
    $("#letra p").each((i, el) => {
      text += $(el).html().split("<br>").join("\n") + "\n\n";
    });
    return he.unescape(text.trim());
  },
};

google.register(provider);

module.exports = provider;
