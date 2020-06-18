import React, { useState, useEffect } from "react";
import SyncLine from "./SyncLine";

export default function Sync(props) {
  const [alignments, setAlignments] = useState([]);

  useEffect(() => {
    setAlignments(props.alignments);
  }, [props.alignments]);

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

  return (
    <div className="flex flex-col items-center">
      {alignments
        ? alignments.map((alignment, i) => (
            <div className="w-3/6" key={i + 1}>
              <SyncLine
                prevAlignment={i > 0 ? alignments[i - 1] : null}
                alignment={alignment}
                nextAlignment={
                  i < alignments.length - 1 ? alignments[i + 1] : null
                }
                onChange={(a) => handleChange(a, i)}
                audioUrl={props.audioUrl}
              ></SyncLine>
            </div>
          ))
        : null}
    </div>
  );
}
