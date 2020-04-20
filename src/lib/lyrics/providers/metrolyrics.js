const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "metrolyrics.com";
const supported = () => true;

async function search(query) {
  const site = "https://www.metrolyrics.com/";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  let lines = [];
  $(".verse").each((i, el) => {
    lines = lines.concat(
      $(el)
        .text()
        .split("\n")
        .filter((l) => l !== "")
    );
  });
  return lines.join("\n");
}

module.exports = {
  name,
  supported,
  search,
};
