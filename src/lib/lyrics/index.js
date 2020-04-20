const debug = require("debug")("youka:lyrics");
const gt = require("../google-translate");

const providers = [
  require("./providers/google"),
  require("./providers/musixmatch"),
  require("./providers/genius"),
  require("./providers/lyricsmint"),
  require("./providers/gasazip"),
  require("./providers/utanet"),
  require("./providers/musica"),
  require("./providers/ttlyrics"),
  require("./providers/metrolyrics"),
  require("./providers/lyrics"),
  require("./providers/azlyrics"),
  require("./providers/buscaletras"),
  require("./providers/cmtv"),
  require("./providers/utamap"),
  require("./providers/sanook"),
  require("./providers/kapook"),
];

async function search(query) {
  let lang;
  try {
    lang = await gt.language(query);
    debug(lang);
  } catch (e) {
    debug(e);
  }
  for (let i = 0; i < providers.length; i++) {
    try {
      const provider = providers[i];
      if (lang && !provider.supported(lang)) continue;
      const lyrics = await provider.search(query);
      if (lyrics) {
        debug(provider.name);
        debug(lyrics);
        return lyrics;
      }
    } catch (error) {
      continue;
    }
  }
}

module.exports = search;
