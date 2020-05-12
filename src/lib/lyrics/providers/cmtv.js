const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "cmtv.com.ar";
const supported = (lang) => lang === "es";
const site = "https://www.cmtv.com.ar/discos_letras/letra.php";

google.register(name, site);
const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url, { encoding: "latin1" });
  const $ = cheerio.load(html);
  const l = $("main p").text().trim();
  return l;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
