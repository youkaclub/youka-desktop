const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "sanook.com";
const supported = (lang) => lang === "th";

async function search(query) {
  const site = "https://www.sanook.com/music/song";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const lines = [];
  $(".jsx-2663638062 > p").each((i, el) => {
    const line = $(el).text();
    if (
      (i < 3 && line.includes(":")) ||
      line.startsWith("***") ||
      line.trim() === ""
    )
      return;
    lines.push(line);
  });
  const l = lines.join("\n");
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
