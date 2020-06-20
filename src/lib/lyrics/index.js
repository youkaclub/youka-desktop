const debug = require("debug")("youka:desktop");
const gt = require("../google-translate");
const rollbar = require("../rollbar");
const providers = require("./providers");

async function search(query) {
  let lang;
  try {
    lang = await gt.language(query);
    debug(lang);
  } catch (e) {
    rollbar.error(e);
    debug(e);
  }

  for (let i = 0; i < providers.length; i++) {
    try {
      const provider = providers[i];
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
}

module.exports = search;
