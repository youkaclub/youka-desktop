const rp = require("request-promise");
var parseString = require("xml2js").parseString;
var stringSimilarity = require("string-similarity");

const re = /\[\d+:\d+\.\d+\](.*)/;

const name = "ttlyrics.com";
const supported = () => true;

async function parseXML(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function search(query) {
  const jar = rp.jar();
  const xml = await rp(
    `http://ttlyrics.com/api/search?title=${encodeURIComponent(query)}`,
    {
      jar,
    }
  );
  const obj = await parseXML(xml);
  if (!obj || !obj.result || !obj.result.lrc || !obj.result.lrc.length) return;
  const results = obj.result.lrc
    .map((r) => r["$"])
    .filter((r) => r.artist && r.title);
  const strings = results.map((r) => `${r.artist} ${r.title}`);
  const match = stringSimilarity.findBestMatch(query, strings);
  if (match.bestMatch.rating < 0.4) return;
  const id = results[match.bestMatchIndex].id;
  const text = await rp(`http://ttlyrics.com/api/download?id=${id}`, { jar });
  return lyrics(text);
}

function lyrics(text) {
  const lines = [];
  text.split("\n").filter((line) => {
    const arr = line.match(re);
    if (!arr || arr.length !== 2) return null;
    lines.push(arr[1].split("     ")[0]);
    return null;
  });
  return lines.join("\n");
}

module.exports = {
  name,
  supported,
  search,
};
