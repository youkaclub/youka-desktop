import React from "react";
import VideoListItem from "./VideoListItem";

export default function VideoList({ videos }) {
  return (
    <div className="flex flex-row flex-wrap justify-center">
      {videos.map((video, index) => (
        <div key={index} className="m-3">
          <VideoListItem video={video} />
        </div>
      ))}
    </div>
  );
}
