import React, { useState, useEffect } from "react";
import { Input, Button } from "semantic-ui-react";
import SyncTime from "./SyncTime";

export default function SyncLine({ alignment, onPlay, onChange }) {
  const [text, setText] = useState(alignment.text);
  const [start, setStart] = useState(alignment.start);
  const [end, setEnd] = useState(alignment.end);
  const [deltams, setDeltams] = useState(10);

  const delta = 1;

  useEffect(() => {
    if (alignment.text.split(" ").length > 1) {
      setDeltams(10);
    } else {
      setDeltams(1);
    }
  }, [alignment.text]);

  function handleTextChange(e, data) {
    setText(data.value);
    onChange({
      ...alignment,
      start,
      end,
      text: data.value,
    });
  }

  function handleStartChange(time) {
    const e = end > time ? end : time + delta;
    setStart(time);
    setEnd(e);

    onChange({
      ...alignment,
      start: time,
      end: e,
      text,
    });

    onPlay(time, end);
  }

  function handleEndChange(time) {
    const s = start < time ? start : end - delta;
    setStart(s);
    setEnd(time);

    onChange({
      ...alignment,
      start: s,
      end: time,
      text,
    });

    onPlay(start, time);
  }

  function handleClickPlay() {
    onPlay(start, end);
  }

  return (
    <div className="flex flex-row p-2">
      <Button icon="play" onClick={handleClickPlay} />
      <SyncTime time={start} deltams={deltams} onChange={handleStartChange} />
      <Input
        className="p-2 w-3/4"
        size="big"
        value={text}
        onChange={handleTextChange}
      />
      <SyncTime time={end} deltams={deltams} onChange={handleEndChange} />
    </div>
  );
}
