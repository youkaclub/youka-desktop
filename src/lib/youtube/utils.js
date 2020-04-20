const rp = require("./request-promise");

const blacklist = [
  "lyrics",
  "live",
  "guitar",
  "cover",
  "karaoke",
  "remix",
  "reaction",
  "dance",
  "piano",
  "instrumental",
  "playlist",
  "trailer",
  "soundtrack",
  "full album",
  "greatest hits",
  "mix -",
  "the voice",
  "audition",
];

const openBrackets = ["(", "（", "[", "【", "{", "《"];
const closeBrackets = [")", "]", "】", "}", "》"];
function removeBrackets(str) {
  let counter = 0;
  for (var i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    const open = openBrackets.includes(char);
    const close = closeBrackets.includes(char);
    if (open) {
      counter++;
    } else if (close) {
      counter--;
    }
    if (open || close || counter) {
      str = str.substr(0, i) + " " + str.substr(i + 1);
    }
  }
  str = str.replace(/\s+/g, " ");
  return str;
}
function cleanTitle(r) {
  r = removeBrackets(r);
  r = r.replace(
    /(official video|official music video|music video|video oficial)/gi,
    ""
  );
  r = r.replace(/(\s|-)+$/g, "");
  r = r.trim();
  return r;
}

function cleanResults(results) {
  const cr = [];
  results.map((result) => {
    let r = result["title"];
    const isBlacklist = blacklist.find((b) => b === r.toLowerCase());
    if (isBlacklist) return null;
    r = cleanTitle(r);
    const words = r.split(" ");
    if (words.length < 2) return null;
    result["title"] = r;
    cr.push(result);
    return null;
  });

  return cr;
}

async function initialData(url) {
  const html = await rp(url);
  const re = /window\["ytInitialData"\] = (.*?);\s+window\["ytInitialPlayerResponse"\]/s;
  const match = re.exec(html);
  if (!match || match.length !== 2) return;
  return JSON.parse(match[1]);
}

module.exports = {
  cleanTitle,
  cleanResults,
  initialData,
};
