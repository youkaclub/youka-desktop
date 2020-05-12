const cheerio = require("cheerio");
const rp = require("./request-promise");

const name = "google.com";
const supported = () => true;

async function search(query) {
  query = query + " lyrics";
  query = encodeURIComponent(query);
  query = query.replace(/%20/g, "+");
  const url = `https://www.google.com/search?q=${query}`;
  return url;
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const lines = [];
  $('span[jsname="YS01Ge"]').map((i, el) => lines.push($(el).text().trim()));
  if (!lines.length) return;
  const l = lines.join("\n").trim();
  return l;
}

module.exports = {
  name,
  supported,
  search,
  lyrics,
};
