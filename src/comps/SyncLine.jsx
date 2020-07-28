import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Icon } from "semantic-ui-react";
import SyncTime from "./SyncTime";

export default function SyncLine({
  prevAlignment,
  alignment,
  nextAlignment,
  onChange,
  audioUrl,
}) {
  const [text, setText] = useState(alignment.text);
  const [start, setStart] = useState(alignment.start);
  const [end, setEnd] = useState(alignment.end);
  const [visible, setVisible] = useState(false);
  const [deltams, setDeltams] = useState(100);
  const [paused, setPaused] = useState(true);

  const audioRef = useRef(new Audio());
  audioRef.current.onplaying = () => setPaused(false);
  audioRef.current.onpause = () => setPaused(true);

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

    play(time, end);
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

    play(start, time);
  }

  function handleTextBlur() {
    onChange({
      ...alignment,
      start,
      end,
      text,
    });
  }

  function handlePlay() {
    play(start, end);
  }

  function handleStart() {
    handleStartChange(audioRef.current.currentTime);
  }

  function handleEnd() {
    handleEndChange(audioRef.current.currentTime);
  }

  function handleBackward() {
    if (prevAlignment) {
      handleStartChange(prevAlignment.end);
    } else {
      handleStartChange(0);
    }
  }

  function handleForward() {
    if (nextAlignment) {
      handleEndChange(nextAlignment.start);
    }
  }

  function handleEnter() {
    setVisible(true);
  }

  function handleLeave() {
    setVisible(false);
    audioRef.current.pause();
  }

  function handlePause() {
    audioRef.current.pause();
  }

  function play(s, e) {
    audioRef.current.pause();
    if (e <= s || s < 0 || e < 0) return;
    const url = `${audioUrl}#t=${s},${e}`;
    audioRef.current.src = url;
    audioRef.current.play();
  }

  return (
    <div
      className="p-4"
      style={visible ? { background: "var(--grey-color-5)" } : undefined}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {visible ? (
        <div className="flex flex-row justify-center">
          <Button
            className="self-center cursor-pointer p-4"
            icon={paused ? "play" : "pause"}
            onClick={paused ? handlePlay : handlePause}
          />
          <Button
            className="self-center cursor-pointer p-4"
            content="Set Start"
            disabled={paused}
            onClick={handleStart}
          />
          <Button
            className="self-center cursor-pointer p-4"
            content="Set End"
            disabled={paused}
            onClick={handleEnd}
          />
        </div>
      ) : null}

      <div className="flex flex-row p-2">
        <Icon
          className="self-center cursor-pointer"
          name="backward"
          onClick={handleBackward}
        />
        <SyncTime time={start} deltams={deltams} onChange={handleStartChange} />
        <Input
          className="p-2 w-3/4"
          size="big"
          value={text}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
        />
        <SyncTime time={end} deltams={deltams} onChange={handleEndChange} />
        <Icon
          className="px-2 self-center cursor-pointer"
          name="forward"
          onClick={handleForward}
        />
      </div>
    </div>
  );
}
