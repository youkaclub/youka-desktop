const rp = require("./request-promise");
const cheerio = require("cheerio");
const utils = require("./utils");

const name = "musixmatch.com";
const supported = () => true;

async function search(query) {
  const site = "https://www.musixmatch.com/lyrics";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  const html = await rp(url);
  const $ = cheerio.load(html);
  let text = "";
  $("span.lyrics__content__ok").each((i, el) => {
    text += $(el).text();
  });
  text = text.replace(/^\s*[\r\n]/gm, "");
  return text;
}

module.exports = {
  name,
  search,
  supported,
};
