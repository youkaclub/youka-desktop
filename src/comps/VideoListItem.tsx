import React from "react";
import { Video } from "../lib/video";
import styles from "./VideoListItem.module.css";

interface Props {
  video: Video
  onSelect(): void
}

export default function VideoListItem({ video, onSelect }: Props) {
  const [artist, title] = video.title.split(/\s*-\s*/, 2)
  return (
    <div className={styles.item} onClick={onSelect}>
      <div
        className={styles.image}
        style={{ backgroundImage: `url(${video.image})` }}
      />
      <div className={styles.text}>
        <div className={styles.title}>
          {title || artist}
        </div>
        {title && artist && <div className={styles.artist}>
          {artist}
        </div>}
      </div>
    </div>
  );
}
