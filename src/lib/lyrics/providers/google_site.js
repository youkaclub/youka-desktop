const debug = require("debug")("youka:desktop");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const match = require("./utils").match;

const providers = [];
const cache = {};

function register(provider) {
  providers.push(provider);
}

async function search(name, query, lang) {
  const key = `${name}::${query}`;
  if (key in cache) {
    return cache[key];
  }
  const sites = providers.filter((p) => p.supported(lang)).map((p) => p.site);
  const siteQuery = google_search_query(query, sites);
  const num = sites.length * 3;
  const results = await google_search(siteQuery, num);

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const result = results.find(
      (result) =>
        result.url.match(provider.site_re) &&
        (match(query, result.title) || match(query, result.url))
    );
    const url = result ? result.url : null;
    const pkey = `${provider.name}::${query}`;
    cache[pkey] = url;
  }
  return cache[key];
}

function google_search_query(query, sites) {
  return sites.map((site) => `site:${site}`).join(" OR ") + " " + query;
}

async function google_search(query, num) {
  query = encodeURIComponent(query);
  query = query.replace(/%20/g, "+");
  const url = `https://www.google.com/search?q=${query}&num=${num}`;
  debug(url);
  const html = await rp(url);
  const $ = cheerio.load(html);
  const results = [];
  $(".g").each((i, el) => {
    const url = $(el).find(".r > a").attr("href");
    if (!url) return;
    const title = $(el).find(".r h3").text();
    results.push({ url, title });
  });
  return results;
}

module.exports = {
  register,
  search,
  google_search,
  google_search_query,
};
