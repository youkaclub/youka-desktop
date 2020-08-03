import React from "react";
import { Video } from "../lib/video";
import styles from "./VideoListItem.module.css";
import { Icon, Button } from "semantic-ui-react";

interface Props {
  video: Video;
  processingText?: string;
  inQueue?: boolean;
  onSelect(): void;
  onToggleQueue?(): void;
}

export default function VideoListItem({
  video,
  processingText,
  inQueue,
  onSelect,
  onToggleQueue,
}: Props) {
  const [artist, title] = video.title.split(/\s*-\s*/, 2);
  return (
    <div className={styles.item} onClick={onSelect}>
      <div
        className={styles.image}
        style={{ backgroundImage: `url(${video.image})` }}
      >
        {onToggleQueue && (
          <div
            className={styles.queueButtonWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            <Button className={styles.queueButton} onClick={onToggleQueue}>
              <Icon
                className={styles.queueIcon}
                name={inQueue ? "minus square" : "plus square"}
              />
            </Button>
          </div>
        )}
      </div>
      <div className={styles.text}>
        <div className={styles.title}>{title || artist}</div>
        {title && artist && <div className={styles.artist}>{artist}</div>}
        {processingText && (
          <div className={styles.processing}>
            <Icon name="circle notched" loading size="small" /> {processingText}
          </div>
        )}
      </div>
    </div>
  );
}
