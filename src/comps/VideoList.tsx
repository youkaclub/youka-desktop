import React from "react";
import VideoListItem from "./VideoListItem";
import { Video } from "../lib/video";
import styles from "./VideoList.module.css";
import { ProcessingStatus } from "../lib/playback";

interface Props {
  videos: Video[];
  kind: "vertical" | "horizontal";
  processingStatus?: ProcessingStatus;
  nowPlaying?: Video;
  queue: Video[];
  onSelect(video: Video): void;
  onQueue(video: Video): void;
  onUnqueue(video: Video): void;
}

export default function VideoList({
  videos,
  processingStatus,
  kind,
  nowPlaying,
  queue,
  onSelect,
  onQueue,
  onUnqueue,
}: Props) {
  return (
    <div className={styles[kind]}>
      {videos.map((video) => {
        const inQueue = queue?.some((item) => item.id === video.id);
        const onToggleQueue =
          nowPlaying?.id === video.id
            ? undefined
            : inQueue
            ? onUnqueue
            : onQueue;

        return (
          <VideoListItem
            key={video.id}
            video={video}
            inQueue={inQueue}
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
            onToggleQueue={onToggleQueue && (() => onToggleQueue(video))}
          />
        );
      })}
    </div>
  );
}
