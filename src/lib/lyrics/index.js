const debug = require("debug")("youka:desktop");
const amplitude = require("amplitude-js");
const gt = require("../google-translate");
const rollbar = require("../rollbar");
const providers = require("./providers");

async function search(query) {
  if (!query || query.trim() === "") return null;

  let lang;
  try {
    lang = await gt.language(query);
    debug(lang);
  } catch (e) {
    rollbar.error(e);
    debug(e);
  }

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      const url = await provider.search(query, lang);
      if (!url) continue;
      const lyrics = await provider.lyrics(url);
      if (!lyrics || lyrics.length < 50) continue;
      debug(provider.name);
      debug(lyrics);
      return lyrics;
    } catch (e) {
      const msg = `lyrics provider error (${provider.name})`;
      rollbar.error(msg, e);
    }
  }

  amplitude.getInstance().logEvent("LYRICS_NOT_FOUND", { query });
}

module.exports = search;
