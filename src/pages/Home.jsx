import React, { useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import Browse, { Section } from "../comps/Browse";
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

  return <Browse defaultPlaylist={Section.Trending} />;
}
