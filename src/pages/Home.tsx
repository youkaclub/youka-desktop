import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import Browse, { Section } from "../comps/Browse";
import { usePageView } from "../lib/hooks";
import store from "../lib/store";
import { Video } from "../lib/video";
import VideoPlayer from "../comps/VideoPlayer";
import styles from "./Home.module.css";
import TitleBar from "../comps/TitleBar";
import { Environment } from "../comps/Environment";

export default function HomePage() {
  const location = useLocation();
  const history = useHistory();
  const [nowPlaying, setNowPlaying] = useState<Video | undefined>();

  usePageView(location.pathname);

  useEffect(() => {
    if (!store.has("eula")) {
      history.push("/eula");
    }
    // eslint-disable-next-line
  }, []);

  return <Environment>
    <div className={styles.wrapper}>
      <div className={styles.browse}>
        <Browse defaultSection={Section.Trending} onSelectVideo={setNowPlaying} />
      </div>
      <div className={styles.player}>
        <TitleBar />
        {nowPlaying
          ? <VideoPlayer video={nowPlaying} />
          : <ZeroState />}
      </div>
    </div>
  </Environment>;
}

function ZeroState() {
  return <div className={styles.zeroState}>
    Youka
  </div>
}
