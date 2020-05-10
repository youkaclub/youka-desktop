const cheerio = require("cheerio");
const rp = require("./request-promise");
const utils = require("./utils");

const name = "shazam.com";
const supported = () => true;

async function search(query) {
  const site = "https://www.shazam.com/track/";
  const url = await utils.google_search_site(query, site);
  if (!url) return;
  return lyrics(url);
}

async function lyrics(url) {
  const match = url.match(/https:\/\/www\.shazam\.com\/track\/(\d+)\//)
  if (!match || match.length < 2) return
  const id = match[1]
  const urlj = `https://www.shazam.com/discovery/v5/en-US/US/web/-/track/${id}`
  const json = await rp(urlj, { json: true });
  const section = json.sections.find(s => s.type === "LYRICS")
  if (!section || !section.text) return
  const l = section.text.join('\n')
  return l;
}

module.exports = {
  name,
  supported,
  search,
};
