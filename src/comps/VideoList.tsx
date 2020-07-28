import React from "react";
import VideoListItem from "./VideoListItem";
import { Video } from "../lib/video";
import styles from "./VideoList.module.css";

interface Props {
  videos: Video[];
  kind: "vertical" | "horizontal";
  onSelect?(video: Video): void;
}

export default function VideoList({ videos, kind, onSelect }: Props) {
  return (
    <div className={styles[kind]}>
      {videos.map((video) => (
        <VideoListItem
          key={video.id}
          video={video}
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
