import React, {  } from "react";
import { useLocation } from "react-router-dom";
import Browse, { Section } from "../comps/Browse";
import { usePageView } from "../lib/hooks";
import Video from "../comps/Video";
const querystring = require("querystring");

export default function WatchPage() {
  const location = useLocation();
  usePageView(location.pathname);
  const params = querystring.parse(location.search.slice(1));
  const { id, title, videoMode, captionsMode } = params;

  if (!id) return null;

  return (
    <Browse youtubeID={id} defaultPlaylist={Section.Mix}>
      <Video id={id} title={title} defaultVideoMode={videoMode} defaultCaptionsMode={captionsMode} />
    </Browse>
  );
}
