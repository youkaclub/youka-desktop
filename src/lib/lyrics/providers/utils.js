const cheerio = require("cheerio");
const compareTwoStrings = require("string-similarity").compareTwoStrings
const rp = require("./request-promise");

function match(a, b) {
  const score = compareTwoStrings(a,b)
  return score > 0.5
}

async function google_search_site(query, site) {
  query = `site:${site} ${query}`;
  query = encodeURIComponent(query);
  query = query.replace(/%20/g, "+");
  const url = `https://www.google.com/search?q=${query}`;
  const html = await rp(url);
  const $ = cheerio.load(html);
  const result = $(".g a");
  const mmurl = result.attr("href");
  if (!mmurl || !mmurl.startsWith(site)) return;
  return mmurl;
}

module.exports = {
  google_search_site,
  match,
};
