import React, { useState, useEffect } from "react";
import { Input, Button } from "semantic-ui-react";
import SyncTime from "./SyncTime";

export default function SyncLine({ alignment, onPlay, onChange }) {
  const [text, setText] = useState(alignment.text);
  const [start, setStart] = useState(alignment.start);
  const [end, setEnd] = useState(alignment.end);
  const [deltams, setDeltams] = useState(10);

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
    setStart(time);
    onChange({
      ...alignment,
      start: time,
      end,
      text,
    });
    onPlay(time, end);
  }

  function handleEndChange(time) {
    setEnd(time);
    onChange({
      ...alignment,
      start,
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
