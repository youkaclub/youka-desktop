const cheerio = require("cheerio");
const rp = require("./request-promise");

const name = "google.com";

const provider = {
  name,
  supported: () => true,

  search: async (query) => {
    query = encodeURIComponent(query);
    query = query.replace(/%20/g, "+");
    const url = `https://www.google.com/search?q=${query}`;
    return url;
  },

  lyrics: async (url) => {
    const html = await rp(url);
    const $ = cheerio.load(html);
    const paragraph = [];

    $('g-expandable-content[jsname="WbKHeb"] div[jsname="U8S5sf"]').map(
      (i, el) => {
        $(el).find("br").replaceWith("\n");
        paragraph.push($(el).text().trim());
        return null;
      }
    );

    if (!paragraph.length) return;
    return paragraph.join("\n\n").trim();
  },
};

module.exports = provider;
