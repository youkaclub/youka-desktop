import React from "react";
import VideoListItem from "./VideoListItem";
import { Video } from "../lib/video";
import styles from "./VideoList.module.css";
import { ProcessingStatus } from "../lib/playback";

interface Props {
  videos: Video[];
  kind: "vertical" | "horizontal";
  processingStatus?: ProcessingStatus;
  onSelect?(video: Video): void;
}

export default function VideoList({
  videos,
  processingStatus,
  kind,
  onSelect,
}: Props) {
  return (
    <div className={styles[kind]}>
      {videos.map((video) => (
        <VideoListItem
          key={video.id}
          video={video}
          processingText={
            processingStatus?.videoId === video.id
              ? processingStatus.statusText
              : undefined
          }
          onSelect={() => {
            if (onSelect) {
              onSelect(video);
            }
          }}
        />
      ))}
    </div>
  );
}
