import React, { useState, useRef, useEffect } from "react";
import SyncLine from "./SyncLine";

export default function Sync(props) {
  const audioRef = useRef();
  const [alignments, setAlignments] = useState([]);

  useEffect(() => {
    setAlignments(props.alignments);
  }, [props.alignments]);

  function handleChange(alignment, index) {
    const tmp = [...alignments];
    tmp[index] = alignment;
    props.onChange(tmp);
  }

  function handlePlay(s, e) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
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
