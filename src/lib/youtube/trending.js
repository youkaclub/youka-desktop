const rp = require("./request-promise");
const utils = require("./utils");

module.exports = async function () {
  const url = "https://www.youtube.com/feed/trending";
  const html = await rp(url);
  const re = /"url":"(\/feed\/trending\?bp=.*?)"/;
  const match = re.exec(html);
  if (!match || match.length < 2) return [];
  const path = match[1];
  const musicURL = `https://www.youtube.com${path}`;
  const obj = await utils.initialData(musicURL);
  if (!obj) return [];
  const results = [];
  obj.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.items.map(
    (i) => {
      const item = i.videoRenderer;
      const id = item.videoId;
      const title = item.title.runs[0].text;
      const image = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      results.push({
        id,
        title,
        image,
      });
      return null;
    }
  );

  return utils.cleanResults(results);
};
