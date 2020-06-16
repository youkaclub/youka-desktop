const utils = require("./utils");

module.exports = async function (youtubeID) {
  const videoURL = `https://www.youtube.com/watch?v=${youtubeID}`;
  const videoObj = await utils.initialData(videoURL);
  if (!videoObj) return [];
  const el = videoObj.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results.find(
    (r) => "compactRadioRenderer" in r
  );
  if (!el) return [];
  const mixID = el.compactRadioRenderer.playlistId;
  const mixURL = `https://www.youtube.com/watch?v=${youtubeID}&list=${mixID}&start_radio=1`;
  const obj = await utils.initialData(mixURL);
  if (
    !obj ||
    !obj.contents ||
    !obj.contents.twoColumnWatchNextResults ||
    !obj.contents.twoColumnWatchNextResults.playlist ||
    !obj.contents.twoColumnWatchNextResults.playlist.playlist ||
    !obj.contents.twoColumnWatchNextResults.playlist.playlist.contents
  )
    return [];
  const results = [];
  const items =
    obj.contents.twoColumnWatchNextResults.playlist.playlist.contents;
  items.map((item) => {
    const id = item.playlistPanelVideoRenderer.videoId;
    const title = item.playlistPanelVideoRenderer.title.simpleText;
    const image = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    results.push({
      id,
      title,
      image,
    });
    return null;
  });
  return utils.cleanResults(results);
};
