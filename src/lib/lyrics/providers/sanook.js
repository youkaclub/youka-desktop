const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "sanook.com";
const supported = (lang) => lang === "th";
const site = "https://www.sanook.com/music/song";
google.register(name, site);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const html = await rp(url);
  const $ = cheerio.load(html);
  const lines = [];
  $(".jsx-2663638062 > p").each((i, el) => {
    const line = $(el).text();
    if ((i < 3 && line.includes(":")) || line.startsWith("***")) return;
    lines.push(line);
  });
  const l = lines.join("\n").trim();
  return l;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
