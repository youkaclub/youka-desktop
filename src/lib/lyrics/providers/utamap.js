const iconv = require("iconv-lite");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "utamap.com";

const provider = {
  name,
  site: "http://www.utamap.com/showkasi.php",
  site_re: /https?:\/\/www\.utamap\.com\/showkasi\.php\?surl=.*/,
  supported: (lang) => lang === "ja",

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url, { encoding: null });
    const ehtml = iconv.decode(html, "EUC-JP");
    const $ = cheerio.load(ehtml);
    $(".kasi_honbun").find("br").replaceWith("\n");
    const l = $(".kasi_honbun").text().trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
