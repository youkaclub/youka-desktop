const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "buscaletras.com";
const supported = (lang) => lang === "es";
const site = "https://www.buscaletras.com/";
google.register(name, site);
const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  let text = "";
  $(".primary .entry-content p").each((i, el) => {
    text += $(el).text().trim() + "\n\n";
  });
  return text.trim();
}

module.exports = {
  name,
  supported,
  search,
  lyrics,
};
