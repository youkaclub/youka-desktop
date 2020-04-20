const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "musica.com";
const supported = (lang) => lang === "es";

async function search(query) {
  const site = "https://www.musica.com/letras.asp";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const ps = [];
  $("#letra p").each((i, el) => {
    const p = $(el)
      .html()
      .split("<br>")
      .filter((l) => l !== "")
      .join("\n");
    ps.push(p);
  });

  const lyrics = ps.join("\n");

  return lyrics;
}

module.exports = {
  name,
  supported,
  search,
};
