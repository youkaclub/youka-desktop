const cheerio = require("cheerio");
const rp = require("./request-promise");

const providers = [];
const cache = {};

function register(name, site) {
  providers.push({ name, site });
}

async function search(name, query) {
  const key = `${name}::${query}`;
  if (key in cache) {
    return cache[key];
  }
  const sites = providers.map((p) => p.site);
  const siteQuery = google_search_query(query, sites);
  const urls = await google_search(siteQuery);

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const url = urls.find((url) => url.startsWith(provider.site));
    const pkey = `${provider.name}::${query}`;
    cache[pkey] = url;
  }

  return cache[key];
}

function google_search_query(query, sites) {
  return sites.map((site) => `site:${site}`).join(" OR ") + " " + query;
}

async function google_search(query) {
  query = encodeURIComponent(query);
  query = query.replace(/%20/g, "+");
  const url = `https://www.google.com/search?q=${query}&num=30`;
  const html = await rp(url);
  const $ = cheerio.load(html);

  const urls = [];
  $(".g a").each((i, el) => {
    const u = $(el).attr("href");
    urls.push(u);
  });
  return urls;
}

module.exports = {
  providers,
  register,
  search,
  google_search,
  google_search_query,
};
