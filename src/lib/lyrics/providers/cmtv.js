const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "cmtv.com.ar";

const provider = {
  name,
  site: "https://www.cmtv.com.ar/discos_letras/letra.php",
  site_re: /https:\/\/www\.cmtv\.com\.ar\/discos_letras\/letra\.php\?/,
  supported: (lang) => lang === "es",

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url, { encoding: "latin1" });
    const $ = cheerio.load(html);
    const l = $("main p").text().trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
