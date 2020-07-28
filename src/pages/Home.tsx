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

interface RootState {
  version: number;
  nowPlaying?: Video;
  queue: Video[];
  browse: {
    section: BrowseSection;
    searchText: string;
  };
}

// Increment this number whenever RootState is changed in a way that is not
// backwards compatible, to clear any old values that have been persisted
const currentRootStateVersion = 1;

const defaultRootState: RootState = {
  version: currentRootStateVersion,
  queue: [],
  browse: {
    section: BrowseSection.Trending,
    searchText: "",
  },
};

export default function HomePage() {
  const location = useLocation();
  const history = useHistory();
  const [root, setRoot] = useState(loadRootState);

  usePageView(location.pathname);

  useEffect(() => {
    if (!store.has("eula")) {
      history.push("/eula");
    }
    // eslint-disable-next-line
  }, []);

  function update(root: RootState) {
    setRoot(root);
    saveRootState(root);
  }

  function switchBrowseSection(section: BrowseSection) {
    update({
      ...root,
      browse: {
        ...root.browse,
        section,
      },
    });
  }

  function enqueueVideo(video: Video) {
    if (
      root.nowPlaying?.id === video.id ||
      root.queue.some((item) => item.id === video.id)
    ) {
      return;
    }

    update(
      root.nowPlaying
        ? {
            ...root,
            queue: [...root.queue, video],
          }
        : {
            ...root,
            nowPlaying: video,
          }
    );
  }

  const showQueue = root.queue.length > 0;

  return (
    <Environment>
      <div
        className={[styles.wrapper, showQueue && styles.showQueue]
          .filter(Boolean)
          .join(" ")}
      >
        <TitleSearch
          searchText={root.browse.searchText}
          onFocus={() => switchBrowseSection(BrowseSection.Search)}
          onSearch={(value) => {
            update({
              ...root,
              browse: {
                ...root.browse,
                section: BrowseSection.Search,
                searchText: value,
              },
            });
          }}
        />
        <TitleBar />
        <Browse
          section={root.browse.section}
          searchText={root.browse.searchText}
          onSelectVideo={enqueueVideo}
          onSwitchSection={switchBrowseSection}
        />
        <div className={styles.player}>
          {root.nowPlaying ? (
            <VideoPlayer video={root.nowPlaying} />
          ) : (
            <ZeroState />
          )}
        </div>
        {showQueue && (
          <div className={styles.queue}>
            <div className={styles.queueTitle}>Up Next</div>
            <VideoList
              kind="horizontal"
              videos={root.queue}
              onSelect={(video) => {
                const queueIndex = root.queue.findIndex(
                  (item) => item.id === video.id
                );
                if (queueIndex >= 0) {
                  const newQueue = root.queue.slice();
                  const [queueVideo] = newQueue.splice(queueIndex, 1);
                  update({
                    ...root,
                    nowPlaying: queueVideo,
                    queue: newQueue,
                  });
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

function saveRootState(root: RootState) {
  localStorage.setItem("homeState", JSON.stringify(root));
}

function loadRootState(): RootState {
  const json = localStorage.getItem("homeState");
  const parsed = json && (JSON.parse(json) as RootState);
  if (parsed && parsed.version === currentRootStateVersion) {
    return parsed;
  } else {
    return defaultRootState;
  }
}
