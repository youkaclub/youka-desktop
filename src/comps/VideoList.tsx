import React from "react";
import VideoListItem from "./VideoListItem";
import { Video } from "../lib/video";
import styles from "./VideoList.module.css";

interface Props {
  videos: Video[]
  onSelect(video: Video): void
}

export default function VideoList({ videos, onSelect }: Props) {
  return (
    <div className={styles.list}>
      {videos.map(video =>
        <VideoListItem key={video.id} video={video} onSelect={() => onSelect(video)} />
      )}
    </div>
  );
}
