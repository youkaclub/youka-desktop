import React, { useRef, useEffect, useState } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import SubtitlesOctopus from "libass-wasm";
import { useWindowSize } from "@react-hook/window-size";

export default function Player({ youtubeID, videoURL, captionsURL, title }) {
  const playerRef = useRef();
  const videoRef = useRef();
  const captionsRef = useRef();
  const assRef = useRef();

  const [windowWidth, windowHeight] = useWindowSize();
  const [videoHeight, setVideoHeight] = useState(360);
  const [videoWidth, setVideoWidth] = useState(640);

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
        setVideoWidth(videoRef.current.videoWidth);
        setVideoHeight(videoRef.current.videoHeight);
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
        if (!captionsURL.startsWith("[Script Info]")) return;
        var options = {
          video: videoRef.current,
          workerUrl: `${process.env.PUBLIC_URL}/js/subtitles-octopus-worker.js`,
          subContent: captionsURL,
        };
        assRef.current = new SubtitlesOctopus(options);
        setTimeout(() => {
          playerRef.current.toggleCaptions(false);
        }, 0);
      } else if (assRef.current && !captionsURL) {
        assRef.current.freeTrack();
      } else if (
        assRef.current &&
        captionsURL &&
        captionsURL.startsWith("[Script Info]")
      ) {
        assRef.current.setTrack(captionsURL);
      }
    }

    setTrack(captionsURL);
  }, [captionsURL]);

  function calcStyle() {
    const windowRatio = windowWidth / windowHeight;
    const ratio = windowRatio;
    const calcHeight = `${videoHeight * ratio}px`;
    const calcWidth = `${videoWidth * ratio}px`;
    const style = {
      width: calcWidth,
      height: calcHeight,
    };

    return style;
  }

  if (!videoURL) return null;

  return (
    <div className="self-center">
      <div style={calcStyle()}>
        <video
          controls
          playsInline
          id="player"
          crossOrigin="true"
          type="video/mp4"
          preload="auto"
          ref={videoRef}
        >
          <track default kind="captions" srcLang="en" ref={captionsRef} />
        </video>
      </div>
      <div className="flex flex-row justify-between p-1">
        <div className="text-2xl leading-tight p-1">{title}</div>
      </div>
    </div>
  );
}
