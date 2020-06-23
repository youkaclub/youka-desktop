import React, { useEffect, useState, useRef } from "react";
import { Button, Dropdown, Form, TextArea } from "semantic-ui-react";

export default function SyncSimple({
  lyrics,
  audioUrl,
  onAlignments,
  onLyrics,
}) {
  const [lines, setLines] = useState([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [start, setStart] = useState(0);
  const [speed, setSpeed] = useState("Normal");
  const [isStart, setIsStart] = useState(true);
  const [editLyrics, setEditLyrics] = useState();
  const audioRef = useRef(new Audio());
  audioRef.current.onplay = () => setPaused(false);
  audioRef.current.onpause = () => setPaused(true);
  audioRef.current.ontimeupdate = () =>
    setCurrentTime(audioRef.current.currentTime);

  const alignmentsRef = useRef({});
  const lyricsRef = useRef();

  useEffect(() => {
    setLines((lyrics || "").split("\n").filter((line) => line.trim() !== ""));
  }, [lyrics]);

  useEffect(() => {
    audioRef.current.src = audioUrl;
  }, [audioUrl]);

  function handlePlay() {
    audioRef.current.play();
  }

  function handlePause() {
    audioRef.current.pause();
  }

  function handleSetStart() {
    setIsStart(false);
    setStart(audioRef.current.currentTime);
  }

  function handleSetEnd() {
    setIsStart(true);
    alignmentsRef.current[lineIndex] = {
      line: lineIndex + 1,
      start,
      end: audioRef.current.currentTime,
      text: lines[lineIndex],
    };
    setStart(0);
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

  function handleEditLyrics() {
    setEditLyrics(!editLyrics);
    setTimeout(() => {
      if (!editLyrics && lyricsRef.current) {
        lyricsRef.current.focus();
      }
    }, 100);
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

  async function handleLyricsChange(e, data) {
    return onLyrics(data.value);
  }

  function progress() {
    if (lineIndex === 0) return 0;
    return Math.trunc(((lineIndex + 1) / lines.length) * 100);
  }

  function handleUndo() {
    delete alignmentsRef.current[lineIndex - 1];
    setLineIndex(lineIndex - 1);
    setIsStart(true);
    if (lineIndex - 2 < 0) {
      audioRef.current.currentTime = 0;
    } else {
      audioRef.current.currentTime = alignmentsRef.current[lineIndex - 2].end;
    }
  }

  if (!lines) return null;

  return (
    <div className="flex flex-col items-center m-6 h-full w-full justify-center">
      <div className="m-4">
        <Button icon="undo" onClick={handlePlayBackward} />
        <Button
          primary={paused}
          content={paused ? "Start" : "Pause"}
          onClick={paused ? handlePlay : handlePause}
        />
        <Button icon="redo" onClick={handlePlayForward} />
      </div>
      <div className="flex flex-row">
        <Button
          content={editLyrics ? "Close Lyrics Editor" : "Open Lyrics Editor"}
          onClick={handleEditLyrics}
        />
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
      <div className="flex flex-col items-center p-1">
        <div className="p-1">{formatSeconds(currentTime)}</div>
        <div className="p-1">
          Line {lineIndex + 1} / {lines.length} ({progress()}%)
        </div>
      </div>
      <div
        className="m-4 text-4xl"
        style={{ color: isStart ? "#000" : "#2185d0" }}
      >
        {lines.length && lineIndex < lines.length ? lines[lineIndex] : null}
      </div>
      <div className="m-4">
        <Button
          content={"undo"}
          disabled={paused || lineIndex === 0}
          onClick={handleUndo}
        />
        <Button
          content={isStart ? "Set Start" : "Set End"}
          color={isStart ? "green" : "red"}
          disabled={paused}
          onClick={isStart ? handleSetStart : handleSetEnd}
        />
      </div>
      {editLyrics ? (
        <Form className="w-2/4 mt-12">
          <TextArea
            placeholder="Paste here the song lyrics"
            className="text-xl"
            ref={lyricsRef}
            value={lyrics}
            rows={
              lyrics && lyrics.split("\n").length > 10
                ? lyrics.split("\n").length
                : 10
            }
            onChange={handleLyricsChange}
          />
        </Form>
      ) : null}
    </div>
  );
}
