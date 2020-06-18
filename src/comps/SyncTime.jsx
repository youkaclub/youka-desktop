import React, { useState, useEffect } from "react";
import { Icon } from "semantic-ui-react";

export default function SyncTime({ time, deltams, onChange }) {
  const delta = 1;

  const [minutes, setMinutes] = useState();
  const [seconds, setSeconds] = useState();
  const [mseconds, setMseconds] = useState();

  useEffect(() => {
    const tmpTime = parseFloat(time).toFixed(3);
    const tmpMinutes = Math.floor(tmpTime / 60) % 60;
    setMinutes(tmpMinutes);
    setSeconds(Math.floor(tmpTime - tmpMinutes * 60));
    setMseconds(parseInt(tmpTime.slice(-3)));
  }, [time]);

  function handleChange(m, s, ms) {
    const t = m * 60 + s + ms / 1000;
    onChange(t);
  }

  function handleMinutesUp() {
    handleChange(minutes + delta, seconds, mseconds);
  }

  function handleMinutesDown() {
    if (minutes - delta >= 0) {
      handleChange(minutes - delta, seconds, mseconds);
    }
  }

  function handleSecondsUp() {
    if (seconds + delta < 60) {
      handleChange(minutes, seconds + delta, mseconds);
    } else {
      handleChange(minutes + 1, 0, mseconds);
    }
  }

  function handleSecondsDown() {
    if (seconds - delta >= 0) {
      handleChange(minutes, seconds - delta, mseconds);
    } else {
      handleChange(minutes - 1, 59, mseconds);
    }
  }

  function handleMsecondsUp() {
    if (mseconds + deltams < 1000) {
      handleChange(
        minutes,
        seconds,
        Math.round((mseconds + deltams) / deltams) * deltams
      );
    } else {
      handleChange(minutes, seconds + 1, 0);
    }
  }

  function handleMsecondsDown() {
    if (mseconds - deltams >= 0) {
      handleChange(
        minutes,
        seconds,
        Math.round((mseconds - deltams) / deltams) * deltams
      );
    } else {
      handleChange(minutes, seconds - 1, 99);
    }
  }

  return (
    <div className="flex flex-row synctime">
      <div className="flex flex-col items-center justify-between p-1 w-10">
        <div>min</div>
        <Icon
          className="cursor-pointer"
          name="plus"
          onClick={handleMinutesUp}
        />
        <div className="pt-2">{minutes}</div>
        <Icon
          className="cursor-pointer"
          name="minus"
          onClick={handleMinutesDown}
        />
      </div>
      <div className="flex flex-col items-center justify-between p-1 w-10">
        <div>sec</div>
        <Icon
          className="cursor-pointer"
          name="plus"
          onClick={handleSecondsUp}
        />
        <div className="pt-2">{seconds}</div>
        <Icon
          className="cursor-pointer"
          name="minus"
          onClick={handleSecondsDown}
        />
      </div>
      <div className="flex flex-col items-center justify-between p-1 w-10">
        <div>ms</div>
        <Icon
          className="cursor-pointer"
          name="plus"
          onClick={handleMsecondsUp}
        />
        <div className="pt-2">{mseconds}</div>
        <Icon
          className="cursor-pointer"
          name="minus"
          onClick={handleMsecondsDown}
        />
      </div>
    </div>
  );
}
