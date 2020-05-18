const he = require("he");
const safeEval = require("safe-eval");
const cheerio = require("cheerio");
const rp = require("./request-promise");
const google = require("./google_site");

const name = "smule.com";

const provider = {
  name,
  site: "https://www.smule.com/song/",
  site_re: /https:\/\/www\.smule\.com\/song\/.*-lyrics\/.*\/arrangement/,
  supported: () => true,

  search: async (query, lang) => google.search(name, query, lang),

  lyrics: async (url) => {
    console.log(url);
    const html = await rp(url);
    const $ = cheerio.load(html);
    let found = false;
    const scriptEl = $("script").map((i, el) => {
      if (!found) {
        found = $(el).html().trim().startsWith(`window.DataStore`);
        if (found) return el;
      }
      return null;
    });
    let script = $(scriptEl).html();
    if (!script) return;
    script = script.trim();
    script = script.replace("window.DataStore = ", "");
    const dataStore = safeEval(script);
    if (!dataStore) return;
    let lyrics = dataStore.Pages.Song.lyrics;
    lyrics = lyrics.replace(/<br>/g, "\n");
    lyrics = lyrics.replace(/(<p>|<\/p>)/g, "");
    lyrics = he.unescape(lyrics);
    return lyrics;
  },
};

google.register(provider);

module.exports = provider;
