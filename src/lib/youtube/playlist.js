const utils = require("./utils");

module.exports = async function (playlistID) {
  const url = `https://www.youtube.com/playlist?list=${playlistID}`;
  const obj = await utils.initialData(url);
  const playlist = [];

  obj.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents.map(
    (i) => {
      const item = i.playlistVideoRenderer;
      const id = item.videoId;
      const title = item.title.simpleText;
      const image = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      playlist.push({
        id,
        title,
        image,
      });
      return null;
    }
  );
  return playlist;
};
