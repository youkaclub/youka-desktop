import React, { useState, useEffect } from "react";
import { Input } from "semantic-ui-react";
import SyncTime from "./SyncTime";

export default function SyncLine({ alignment, onPlay, onChange }) {
  const [text, setText] = useState(alignment.text);
  const [start, setStart] = useState(alignment.start);
  const [end, setEnd] = useState(alignment.end);
  const [deltams, setDeltams] = useState(100);

  const delta = 1;

  useEffect(() => {
    setText(alignment.text);
    if (alignment.text.split(" ").length > 1) {
      setDeltams(100);
    } else {
      setDeltams(50);
    }
  }, [alignment.text]);

  useEffect(() => {
    setStart(alignment.start);
  }, [alignment.start]);

  useEffect(() => {
    setEnd(alignment.end);
  }, [alignment.end]);

  function handleTextChange(e, data) {
    setText(data.value);
  }

  function handleStartChange(time) {
    if (start === time) return;

    if (time < 0) {
      time = 0;
    }
    const e = end > time ? end : time + delta;

    onChange({
      ...alignment,
      start: time,
      end: e,
      text,
    });

    onPlay(time, end);
  }

  function handleEndChange(time) {
    if (end === time) return;

    if (time < 0) {
      time = 0;
    }
    const s = start < time ? start : end - delta;

    onChange({
      ...alignment,
      start: s,
      end: time,
      text,
    });

    onPlay(start, time);
  }

  function handleTextBlur() {
    onChange({
      ...alignment,
      start,
      end,
      text,
    });
  }

  return (
    <div className="flex flex-row p-2">
      <SyncTime time={start} deltams={deltams} onChange={handleStartChange} />
      <Input
        className="p-2 w-3/4"
        size="big"
        value={text}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
      />
      <SyncTime time={end} deltams={deltams} onChange={handleEndChange} />
    </div>
  );
}
