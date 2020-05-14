const rp = require("./request-promise");
const google = require("./google_site");

const name = "shazam.com";

const provider = {
  name,
  site: "https://www.shazam.com/track/",
  site_re: /https:\/\/www\.shazam\.com\/track\/(\d+)\/.*/,
  supported: () => true,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    const match = url.match(/https:\/\/www\.shazam\.com\/track\/(\d+)\//);
    if (!match || match.length < 2) return;
    const id = match[1];
    const urlj = `https://www.shazam.com/discovery/v5/en-US/US/web/-/track/${id}`;
    const json = await rp(urlj, { json: true });
    const section = json.sections.find((s) => s.type === "LYRICS");
    if (!section || !section.text) return;
    const l = section.text.join("\n").trim();
    return l;
  },
};

google.register(provider);

module.exports = provider;
