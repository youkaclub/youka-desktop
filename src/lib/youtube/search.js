const ytdl = require("ytdl-core");
const rollbar = require("../rollbar");
const utils = require("./utils");

function report(query, initialData) {
  rollbar.warning("youtube initial data", {
    query,
    json: JSON.stringify(initialData, null, 2),
  });
}

module.exports = async function (query) {
  if (!query || query.trim() === "") return [];

  if (query.startsWith("http://") || query.startsWith("https://")) {
    try {
      const id = ytdl.getURLVideoID(query);
      query = `https://www.youtube.com/watch?v=${id}`;
    } catch (e) {
      return [];
    }
  }

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query
  )}`;
  const initialData = await utils.initialData(url);
  const results = utils.parseInitialDataSearchResults(initialData);
  if (!results || !results.length) {
    report(query, initialData);
    return [];
  }
  return utils.cleanResults(results);
};
