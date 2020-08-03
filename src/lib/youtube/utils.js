const rp = require("./request-promise");
const cheerio = require("cheerio");

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
    /(official video|official music video|music video|video oficial| mv(\s|$))/gi,
    ""
  );
  r = r.replace(/(\s|-)+$/g, "");
  r = r.trim();
  return r;
}

function splitArtistTitle(fullTitle) {
  const [artist, title] = fullTitle.split(/\s*[-–]\s*/, 2);
  if (artist) {
    return { artist, title };
  } else {
    return { title: fullTitle };
  }
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
  let html;
  try {
    html = await rp(url);
  } catch (e) {
    console.log(e);
    return null;
  }
  const $ = cheerio.load(html);
  let found = false;
  const scriptEl = $("script").map((i, el) => {
    if (!found) {
      found = $(el).html().trim().startsWith(`window["ytInitialData"] =`);
      if (found) return el;
    }
    return null;
  });
  const script = $(scriptEl).html();
  if (!script) return;
  const start = script.indexOf("{");
  const end = script.indexOf(`window["ytInitialPlayerResponse"]`) - 1;
  if (!start || !end) return;
  const json = script.slice(start, end).trim().slice(0, -1);
  const obj = JSON.parse(json);
  return obj;
}

function parseInitialDataSearchResults(obj) {
  if (!obj || !obj.contents || !obj.contents.twoColumnSearchResultsRenderer) {
    return [];
  }
  const results = [];
  obj.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents.map(
    (contents) => {
      if (!contents.itemSectionRenderer) {
        return [];
      }
      contents.itemSectionRenderer.contents.map((i) => {
        const item = i.videoRenderer;
        if (!item) return null;
        const id = item.videoId;
        const title = item.title.runs[0].text;
        const image = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        let hours, minutes, seconds;
        if (item.lengthText) {
          const durationParts = item.lengthText.simpleText.split(":");
          if (durationParts.length === 3) {
            hours = parseInt(durationParts[0]);
            minutes = parseInt(durationParts[1]);
            seconds = parseInt(durationParts[2]);
          } else if (durationParts.length === 2) {
            minutes = parseInt(durationParts[0]);
            seconds = parseInt(durationParts[1]);
          } else {
            seconds = parseInt(durationParts[0]);
          }
        }
        results.push({
          id,
          title,
          image,
          hours,
          minutes,
          seconds,
        });
        return null;
      });
      return null;
    }
  );

  return results;
}

module.exports = {
  cleanTitle,
  splitArtistTitle,
  cleanResults,
  initialData,
  parseInitialDataSearchResults,
};
