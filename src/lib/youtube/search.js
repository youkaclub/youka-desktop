const ytdl = require("ytdl-core");
const rp = require("request-promise");
const rollbar = require("../rollbar");
const utils = require("./utils");

async function search(query) {
  if (!query || query.trim() === "") return [];

  if (query.startsWith("http://") || query.startsWith("https://")) {
    try {
      const id = ytdl.getURLVideoID(query);
      query = `https://www.youtube.com/watch?v=${id}`;
    } catch (e) {
      return [];
    }
  }

  try {
    const results = await v1(query);
    if (results && results.length) {
      return utils.cleanResults(results);
    }
  } catch (e) {
    rollbar.error("Search v1 failed", e);
  }

  try {
    const results = await v2(query);
    if (results && results.length) {
      return utils.cleanResults(results);
    }
  } catch (e) {
    rollbar.error("Search v2 failed", e);
  }

  return [];
}

async function v1(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query
  )}`;
  const initialData = await utils.initialData(url);
  return utils.parseInitialDataSearchResults(initialData);
}

async function v2(query) {
  const uri = `https://api.youka.club/search?q=${encodeURIComponent(query)}`;
  const results = await rp({
    uri,
    json: true,
    rejectUnauthorized: false,
    strictSSL: false,
    insecure: true,
  });
  return results;
}

module.exports = search;
