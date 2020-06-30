import React, { useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import Shell, { PLAYLIST_TRENDING } from "../comps/Shell";
import { usePageView } from "../lib/hooks";
import store from "../lib/store";

export default function HomePage() {
  const location = useLocation();
  let history = useHistory();

  usePageView(location.pathname);

  useEffect(() => {
    if (!store.has("eula")) {
      history.push("/eula");
    }
    // eslint-disable-next-line
  }, []);

  return <Shell defaultPlaylist={PLAYLIST_TRENDING} />;
}
