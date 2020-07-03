import React, { useEffect, useState, useRef } from "react";
import { Input, Button, Dropdown } from "semantic-ui-react";

export default function SyncSimple({ lyrics, audioUrl, onAlignments }) {
  const [lines, setLines] = useState([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState("Normal");
  const [isStart, setIsStart] = useState(true);

  const audioRef = useRef(new Audio());
  audioRef.current.onplay = () => setPaused(false);
  audioRef.current.onpause = () => setPaused(true);
  audioRef.current.ontimeupdate = () =>
    setCurrentTime(audioRef.current.currentTime);
  const alignmentsRef = useRef({});

  useEffect(() => {
    setLines((lyrics || "").split("\n").filter((line) => line.trim() !== ""));
  }, [lyrics]);

  useEffect(() => {
    audioRef.current.src = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.pause();
    };
  }, []);

  function handlePlay() {
    audioRef.current.play();
  }

  function handlePause() {
    audioRef.current.pause();
  }

  function handleSetStart() {
    setIsStart(false);
    alignmentsRef.current[lineIndex] = {
      line: lineIndex + 1,
      start: audioRef.current.currentTime,
      text: lines[lineIndex],
    };
  }

  function handleSetEnd() {
    setIsStart(true);
    alignmentsRef.current[lineIndex].end = audioRef.current.currentTime;
    if (lineIndex + 1 < lines.length) {
      setLineIndex(lineIndex + 1);
    } else {
      // finished
      audioRef.current.pause();
      const alignments = Object.keys(alignmentsRef.current).map((i) => {
        return alignmentsRef.current[i];
      });
      onAlignments(alignments);
    }
  }

  function handlePlayBackward() {
    setIsStart(true);
    audioRef.current.currentTime -= 5;
  }

  function handlePlayForward() {
    setIsStart(true);
    audioRef.current.currentTime += 5;
  }

  function handleChangeSpeed(e, data) {
    const playbackRate = data.value;
    if (playbackRate === 1) {
      setSpeed("Normal");
    } else {
      setSpeed(playbackRate);
    }
    audioRef.current.playbackRate = playbackRate;
  }

  function formatSeconds(seconds) {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  }

  function handleUndo() {
    if (lineIndex === 0) {
      if (audioRef.current.currentTime > 5) {
        audioRef.current.currentTime = audioRef.current.currentTime - 5;
      } else {
        audioRef.current.currentTime = 0;
      }
    } else if (isStart) {
      audioRef.current.currentTime = alignmentsRef.current[lineIndex - 1].start;
      setLineIndex(lineIndex - 1);
    } else {
      audioRef.current.currentTime = alignmentsRef.current[lineIndex - 1].end;
    }
    setIsStart(!isStart);
  }

  function handleLineChange(e, data) {
    const tmp = [...lines];
    tmp[lineIndex] = data.value;
    setLines(tmp);
  }

  if (!lines) return null;

  return (
    <div className="flex flex-col items-center h-full w-full justify-center">
      <div className="flex flex-row">
        <Dropdown
          button
          text={`Speed: ${speed}`}
          onChange={handleChangeSpeed}
          defaultValue={1}
          options={[
            {
              text: "0.5",
              value: 0.5,
            },
            {
              text: "0.75",
              value: 0.75,
            },
            {
              text: "Normal",
              value: 1,
            },
            {
              text: "1.25",
              value: 1.25,
            },
            {
              text: "1.5",
              value: 1.5,
            },
          ]}
        />
      </div>
      <div className="flex flex-row items-center m-4">
        <div className="px-2">{formatSeconds(currentTime)}</div>
        <Button icon="undo" onClick={handlePlayBackward} />
        <Button
          className="w-32"
          primary={paused}
          content={paused ? "Play" : "Pause"}
          onClick={paused ? handlePlay : handlePause}
        />
        <Button icon="redo" onClick={handlePlayForward} />
        <div className="px-2">
          {lineIndex + 1} / {lines.length}
        </div>
      </div>
      <div>
        {lines.length && lineIndex < lines.length ? (
          <Input
            size="massive"
            style={{
              width: `${lines[lineIndex].length}rem`,
              minWidth: "20rem",
            }}
            className={isStart ? "secondary" : "primary"}
            value={lines[lineIndex]}
            onChange={handleLineChange}
          />
        ) : null}
      </div>
      <div className="m-4">
        <Button
          content={"undo"}
          disabled={paused || (lineIndex === 0 && isStart)}
          onClick={handleUndo}
        />
        <Button
          className="w-40"
          content={isStart ? "Set Start" : "Set End"}
          color={isStart ? "green" : "red"}
          disabled={paused}
          onClick={isStart ? handleSetStart : handleSetEnd}
        />
      </div>
    </div>
  );
}
