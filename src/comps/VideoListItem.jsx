import React from "react";
import { Link } from "react-router-dom";

export default function VideoListItem({ video }) {
  return (
    <Link to={`/watch?id=${video.id}&title=${video.title}&image=${video.image}`}>
      <div className="cursor-pointer" style={{ width: "30vw" }}>
        <div className="relative" style={{ paddingBottom: "56.2%" }}>
          <img
            className="absolute object-cover w-full h-full"
            alt=""
            src={video.image}
          ></img>
        </div>
        <div className="w-full leading-tight text-black p-1 text-2xl">
          {video.title}
        </div>
      </div>
    </Link>
  );
}
