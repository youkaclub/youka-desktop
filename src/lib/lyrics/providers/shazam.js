const rp = require("./request-promise");
const google = require("./google_site");

const name = "shazam.com";
const supported = () => true;
const site = "https://www.shazam.com/track/";
google.register(name, site);

const search = async (query) => google.search(name, query);

async function lyrics(url) {
  const match = url.match(/https:\/\/www\.shazam\.com\/track\/(\d+)\//);
  if (!match || match.length < 2) return;
  const id = match[1];
  const urlj = `https://www.shazam.com/discovery/v5/en-US/US/web/-/track/${id}`;
  const json = await rp(urlj, { json: true });
  const section = json.sections.find((s) => s.type === "LYRICS");
  if (!section || !section.text) return;
  const l = section.text.join("\n").trim();
  return l;
}

module.exports = {
  name,
  search,
  supported,
  lyrics,
};
