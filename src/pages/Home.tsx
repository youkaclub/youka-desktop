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
import { Playback, ProcessingStatus } from "../lib/playback";

export default function HomePage() {
  const location = useLocation();
  const history = useHistory();
  const [playback] = useState(() => new Playback());
  const [browseSection, setBrowseSection] = useState(BrowseSection.Search);
  const [searchText, setSearchText] = useState("");
  const [nowPlaying, setNowPlaying] = useState<Video | undefined>();
  const [queue, setQueue] = useState<Video[]>([]);
  const [processingStatus, setProcessingStatus] = useState<
    ProcessingStatus | undefined
  >();

  useEffect(() => {
    playback.getNowPlaying().then(setNowPlaying);
    playback.getQueue().then(setQueue);
    playback.getProcessingStatus().then(setProcessingStatus);
    playback.on("nowPlayingChanged", setNowPlaying);
    playback.on("queueChanged", setQueue);
    playback.on("processingStatusChanged", setProcessingStatus);
    return () => {
      playback.off("nowPlayingChanged", setNowPlaying);
      playback.off("queueChanged", setQueue);
      playback.off("processingStatusChanged", setProcessingStatus);
    };
  }, [playback]);

  usePageView(location.pathname);

  useEffect(() => {
    if (!store.has("eula")) {
      history.push("/eula");
    }
    // eslint-disable-next-line
  }, []);

  return (
    <Environment>
      <div className={nowPlaying ? styles.wrapper : styles.wrapperNoPlayer}>
        <div className={styles.titleBar}>
          <TitleBar
            searchText={searchText}
            onFocus={() => setBrowseSection(BrowseSection.Search)}
            onSearch={(value) => {
              setBrowseSection(BrowseSection.Search);
              setSearchText(value);
            }}
          />
        </div>
        {nowPlaying && (
          <div className={styles.player}>
            <VideoPlayer
              video={nowPlaying}
              processingStatus={
                processingStatus?.videoId === nowPlaying.id
                  ? processingStatus.statusText
                  : undefined
              }
              onEnded={() => playback.finishPlayback(nowPlaying.id)}
            />
          </div>
        )}
        <Browse
          section={browseSection}
          searchText={searchText}
          processingStatus={processingStatus}
          nowPlaying={nowPlaying}
          queue={queue}
          listKind={nowPlaying ? "vertical" : "grid"}
          onSwitchSection={setBrowseSection}
          onPlayVideo={(video) => playback.playVideo(video)}
          onQueueVideo={(video) => playback.enqueueVideo(video)}
          onUnqueueVideo={(video) => playback.unenqueueVideo(video)}
        />
      </div>
    </Environment>
  );
}
