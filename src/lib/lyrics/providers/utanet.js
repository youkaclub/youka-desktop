const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "uta-net.com";
const supported = (lang) => lang === "ja";
const site = "https://www.uta-net.com/song/";
const site_re = /https:\/\/www\.uta-net\.com\/song\/\d+/;
google.register(name, site, site_re);
const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  $("#kashi_area").find("br").replaceWith("\n");
  const l = $("#kashi_area").text().trim();
  return l;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
