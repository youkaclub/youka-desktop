import React, { useRef, useEffect } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import SubtitlesOctopus from "libass-wasm";
import * as library from "../lib/library";
import rollbar from "../lib/rollbar";

interface Props {
  youtubeID: string;
  videoURL: string;
  captionsURL?: string;
  lang?: string;
  className?: string;
  onEnded?(): void;
}

export default function Player({
  youtubeID,
  videoURL,
  captionsURL,
  lang,
  className,
  onEnded,
}: Props) {
  const playerRef = useRef<Plyr>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionsRef = useRef<HTMLTrackElement>(null);
  const assRef = useRef<SubtitlesOctopus>();

  useEffect(() => {
    const plyrOptions = {
      controls: ["play-large", "play", "progress", "volume", "fullscreen"],
    };
    playerRef.current = new Plyr("#player", plyrOptions);
  }, []);

  useEffect(() => {
    (async function () {
      if (!videoURL || !videoRef.current) return;
      const currVideoURL = videoRef.current.getAttribute("src");
      const isSame = currVideoURL && currVideoURL.includes(youtubeID);
      const currentTime = videoRef.current.currentTime;
      videoRef.current.setAttribute("src", videoURL);
      try {
        await videoRef.current.play();
      } catch (e) {}
      if (isSame) {
        videoRef.current.currentTime = currentTime;
      }
    })();
  }, [videoURL, youtubeID]);

  useEffect(() => {
    if (captionsURL) {
      if (!captionsURL.endsWith(".vtt")) return;
      captionsRef.current?.setAttribute("src", captionsURL);
      setTimeout(() => {
        playerRef.current?.toggleCaptions(true);
      }, 0);
    } else {
      setTimeout(() => {
        playerRef.current?.toggleCaptions(false);
      }, 0);
    }
  }, [captionsURL]);

  useEffect(() => {
    async function setTrack(captionsURL: string) {
      if (!assRef.current && captionsURL) {
        if (!captionsURL.startsWith("[Script Info]")) return;

        const fonts = [];
        if (lang) {
          try {
            const font = await library.font(lang);
            if (font) {
              fonts.push(font);
            }
          } catch (e) {
            console.log(e);
            rollbar.error(e);
          }
        }

        var options = {
          video: videoRef.current,
          workerUrl: `${process.env.PUBLIC_URL}/js/subtitles-octopus-worker.js`,
          subContent: captionsURL,
          fonts,
        };
        assRef.current = new SubtitlesOctopus(options);
        setTimeout(() => {
          playerRef.current?.toggleCaptions(false);
        }, 0);
      } else if (assRef.current && !captionsURL) {
        assRef.current.freeTrack();
      } else if (
        assRef.current &&
        captionsURL &&
        captionsURL.startsWith("[Script Info]")
      ) {
        if (captionsURL) {
          assRef.current.setTrack(captionsURL);
        }
      }
    }

    if (captionsURL) {
      setTrack(captionsURL);
    }
  }, [captionsURL, lang]);

  if (!videoURL) return null;

  return (
    <div className={className}>
      <video
        controls
        playsInline
        id="player"
        crossOrigin="true"
        preload="auto"
        ref={videoRef}
        onEnded={onEnded}
        className={className}
      >
        <track default kind="captions" srcLang="en" ref={captionsRef} />
      </video>
    </div>
  );
}
