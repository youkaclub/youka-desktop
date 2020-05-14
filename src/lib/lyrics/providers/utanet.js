const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "uta-net.com";

const provider = {
  name,
  site: "https://www.uta-net.com/song/",
  site_re: /https:\/\/www\.uta-net\.com\/song\/\d+/,
  supported: (lang) => lang === "ja",

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    $("#kashi_area").find("br").replaceWith("\n");
    const l = $("#kashi_area").text().trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
