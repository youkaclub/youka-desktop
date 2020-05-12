const he = require("he");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "musica.com";
const supported = (lang) => lang === "es";
const site = "https://www.musica.com/letras.asp";
google.register(name, site);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  let text = "";
  $("#letra p").each((i, el) => {
    text += $(el).html().split("<br>").join("\n") + "\n\n";
  });

  return he.unescape(text.trim());
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
