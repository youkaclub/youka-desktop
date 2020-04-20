import React from "react";
import { useLocation } from "react-router-dom";
import Shell, { PLAYLIST_TRENDING } from "../comps/Shell";
import { usePageView } from "../lib/hooks";

export default function HomePage() {
  const location = useLocation();
  usePageView(location.pathname);

  return <Shell defaultPlaylist={PLAYLIST_TRENDING} />;
}
