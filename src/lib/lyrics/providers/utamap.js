const iconv = require("iconv-lite");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "utamap.com";
const supported = (lang) => lang === "ja";
const site = "http://www.utamap.com/showkasi.php";
google.register(name, site);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url, { encoding: null });
  const ehtml = iconv.decode(html, "EUC-JP");
  const $ = cheerio.load(ehtml);
  $(".kasi_honbun").find("br").replaceWith("\n");
  const l = $(".kasi_honbun").text().trim();
  return l;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
