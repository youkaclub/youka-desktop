import React, { useState, useRef, useEffect } from "react";
import SyncLine from "./SyncLine";

export default function Sync(props) {
  const audioRef = useRef();
  const [alignments, setAlignments] = useState([]);

  useEffect(() => {
    setAlignments(props.alignments);
  }, [props.alignments]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  function handleChange(alignment, index) {
    const tmp = [...alignments];
    tmp[index] = alignment;

    for (let i = index - 1; i >= 0; i--) {
      if (tmp[i + 1].start < tmp[i].end) {
        tmp[i].end = tmp[i + 1].start;
      }
      if (tmp[i].end <= tmp[i].start) {
        tmp[i].start = tmp[i].end - 1;
      }
      if (tmp[i].start < 0) {
        tmp[i].start = 0;
        tmp[i].end = 1;
      }
    }

    for (let i = index + 1; i < tmp.length; i++) {
      if (tmp[i].start < tmp[i - 1].end) {
        tmp[i].start = tmp[i - 1].end;
      }
      if (tmp[i].end <= tmp[i].start) {
        tmp[i].end = tmp[i].start + 1;
      }
      if (tmp[i].start < 0) {
        tmp[i].start = 0;
        tmp[i].end = 1;
      }
    }

    props.onChange(tmp);
  }

  function handlePlay(s, e) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (e <= s || s < 0 || e < 0) return;
    const url = `${props.audioUrl}#t=${s},${e}`;
    audioRef.current = new Audio(url);
    audioRef.current.play();
  }

  return (
    <div className="flex flex-col items-center">
      {alignments
        ? alignments.map((alignment, index) => (
            <div className="w-2/4" key={index + 1}>
              <SyncLine
                alignment={alignment}
                onPlay={handlePlay}
                onChange={(a) => handleChange(a, index)}
              ></SyncLine>
            </div>
          ))
        : null}
    </div>
  );
}
