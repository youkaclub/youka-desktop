const cheerio = require("cheerio");
const rp = require("./request-promise");

const name = "google.com";

const provider = {
  name,
  supported: () => true,

  search: async (query) => {
    query = query + " lyrics";
    query = encodeURIComponent(query);
    query = query.replace(/%20/g, "+");
    const url = `https://www.google.com/search?q=${query}`;
    return url;
  },

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const lines = [];
    $('span[jsname="YS01Ge"]').map((i, el) => lines.push($(el).text().trim()));
    if (!lines.length) return;
    const l = lines.join("\n").trim();
    return l;
  },
};

module.exports = provider;
