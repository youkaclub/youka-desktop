const rp = require("request-promise");
var parseString = require("xml2js").parseString;
var stringSimilarity = require("string-similarity");

const re = /\[\d+:\d+\.\d+\](.*)/;
const jar = rp.jar();
const name = "ttlyrics.com";

async function parseXML(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

const provider = {
  name,
  supported: (lang) => ["ja", "ko", "zh"].includes(lang),

  search: async (query) => {
    let xml;
    try {
      const uri = `http://lyrics.ttlyrics.com:10086/api/search?title=${encodeURIComponent(
        query
      )}`;
      xml = await rp({
        uri,
        jar,
      });
    } catch (e) {
      console.log(e);
      return null;
    }
    const obj = await parseXML(xml);
    if (!obj || !obj.result || !obj.result.lrc || !obj.result.lrc.length)
      return;
    const results = obj.result.lrc
      .map((r) => r["$"])
      .filter((r) => r.artist && r.title);
    const strings = results.map(
      (r) => `${r.artist.toLowerCase()} ${r.title.toLowerCase()}`
    );
    const match = stringSimilarity.findBestMatch(query.toLowerCase(), strings);
    if (match.bestMatch.rating < 0.4) return;
    const id = results[match.bestMatchIndex].id;
    if (!id) return;
    const url = `http://lyrics.ttlyrics.com:10086/api/download?id=${id}`;
    return url;
  },

  lyrics: async (url) => {
    let text;
    try {
      text = await rp(url, { jar });
    } catch (e) {
      return null;
    }
    const lines = [];
    text.split("\n").filter((line, i) => {
      if (i < 3 && line.includes(":")) return null;
      const arr = line.match(re);
      if (!arr || arr.length !== 2) return null;
      lines.push(arr[1].split("     ")[0]);
      return null;
    });
    return lines.join("\n");
  },
};

module.exports = provider;
