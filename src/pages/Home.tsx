import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import Browse, { BrowseSection } from "../comps/Browse";
import { usePageView } from "../lib/hooks";
import store from "../lib/store";
import { Video } from "../lib/video";
import VideoPlayer from "../comps/VideoPlayer";
import styles from "./Home.module.css";
import TitleBar from "../comps/TitleBar";
import { Environment } from "../comps/Environment";
import VideoList from "../comps/VideoList";
import TitleSearch from "../comps/TitleSearch";

export default function HomePage() {
  const location = useLocation();
  const history = useHistory();
  const [browseSection, setBrowseSection] = useState<BrowseSection>(
    BrowseSection.Trending
  );
  const [searchText, setSearchText] = useState("");
  const [nowPlaying, setNowPlaying] = useState<Video | undefined>();
  const [queue, setQueue] = useState<Video[]>([]);

  usePageView(location.pathname);

  useEffect(() => {
    if (!store.has("eula")) {
      history.push("/eula");
    }
    // eslint-disable-next-line
  }, []);

  function enqueueVideo(video: Video) {
    if (nowPlaying) {
      if (
        nowPlaying.id !== video.id &&
        !queue.some((item) => item.id === video.id)
      ) {
        setQueue([...queue, video]);
      }
    } else {
      setNowPlaying(video);
    }
  }

  const showQueue = queue.length > 0;

  return (
    <Environment>
      <div
        className={[styles.wrapper, showQueue && styles.showQueue]
          .filter(Boolean)
          .join(" ")}
      >
        <TitleSearch
          onFocus={() => setBrowseSection(BrowseSection.Search)}
          onSearch={(value) => {
            setBrowseSection(BrowseSection.Search);
            setSearchText(value);
          }}
        />
        <TitleBar />
        <Browse
          section={browseSection}
          searchText={searchText}
          onSelectVideo={enqueueVideo}
          onSwitchSection={setBrowseSection}
        />
        <div className={styles.player}>
          {nowPlaying ? <VideoPlayer video={nowPlaying} /> : <ZeroState />}
        </div>
        {showQueue && (
          <div className={styles.queue}>
            <div className={styles.queueTitle}>Up Next</div>
            <VideoList
              kind="horizontal"
              videos={queue}
              onSelect={(video) => {
                const queueIndex = queue.findIndex(
                  (item) => item.id === video.id
                );
                if (queueIndex >= 0) {
                  const newQueue = queue.slice();
                  const [queueVideo] = newQueue.splice(queueIndex, 1);
                  setQueue(newQueue);
                  setNowPlaying(queueVideo);
                }
              }}
            />
          </div>
        )}
      </div>
    </Environment>
  );
}

function ZeroState() {
  return <div className={styles.zeroState}>Youka</div>;
}
