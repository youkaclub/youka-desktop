import fs from "fs";
import React, { useRef, useEffect } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import SubtitlesOctopus from "libass-wasm";

export default function Player({ youtubeID, videoURL, captionsURL }) {
  const playerRef = useRef();
  const videoRef = useRef();
  const captionsRef = useRef();
  const assRef = useRef();

  useEffect(() => {
    const plyrOptions = {
      controls: ["play-large", "play", "progress", "volume", "fullscreen"],
    };
    playerRef.current = new Plyr("#player", plyrOptions);
  }, []);

  useEffect(() => {
    (async function () {
      if (!videoURL) return;
      const currVideoURL = videoRef.current.getAttribute("src");
      const isSame = currVideoURL && currVideoURL.includes(youtubeID);
      const currentTime = playerRef.current.currentTime;
      videoRef.current.setAttribute("src", videoURL);
      try {
        await playerRef.current.play();
      } catch (e) {}
      if (isSame) {
        playerRef.current.currentTime = currentTime;
      }
    })();
  }, [videoURL, youtubeID]);

  useEffect(() => {
    if (captionsURL) {
      if (!captionsURL.endsWith(".vtt")) return;
      captionsRef.current.setAttribute("src", captionsURL);
      setTimeout(() => {
        playerRef.current.toggleCaptions(true);
      }, 0);
    } else {
      setTimeout(() => {
        playerRef.current.toggleCaptions(false);
      }, 0);
    }
  }, [captionsURL]);

  useEffect(() => {
    async function setTrack(captionsURL) {
      if (!assRef.current && captionsURL) {
        if (!captionsURL.endsWith(".ass")) return;
        captionsURL = captionsURL.replace("file://", "");
        const content = await fs.promises.readFile(captionsURL, "utf-8");
        var options = {
          video: videoRef.current,
          workerUrl: `${process.env.PUBLIC_URL}/js/subtitles-octopus-worker.js`,
          subContent: content,
        };
        assRef.current = new SubtitlesOctopus(options);
      } else if (assRef.current && !captionsURL) {
        assRef.current.freeTrack();
      } else if (
        assRef.current &&
        captionsURL &&
        captionsURL.endsWith(".ass")
      ) {
        captionsURL = captionsURL.replace("file://", "");
        const content = await fs.promises.readFile(captionsURL, "utf-8");
        assRef.current.setTrack(content);
      }
    }

    setTrack(captionsURL);
  }, [captionsURL]);

  if (!videoURL) return null;

  return (
    <video
      controls
      playsInline
      width="480"
      height="360"
      id="player"
      crossOrigin="true"
      ref={videoRef}
      type="video/mp4"
      className="object-cover"
      preload="auto"
    >
      <track default kind="captions" srcLang="en" ref={captionsRef} />
    </video>
  );
}
