const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "sanook.com";

const provider = {
  name,
  supported: (lang) => lang === "th",
  site: "https://www.sanook.com/music/song",
  site_re: /https:\/\/www\.sanook\.com\/music\/song/,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
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
  },
};

google.register(provider);

module.exports = provider;
