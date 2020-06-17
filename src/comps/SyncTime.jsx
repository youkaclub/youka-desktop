import React, { useState, useEffect } from "react";
import { Icon } from "semantic-ui-react";

export default function SyncTime({ time, deltams, onChange }) {
  const delta = 1;

  const [minutes, setMinutes] = useState();
  const [seconds, setSeconds] = useState();
  const [mseconds, setMseconds] = useState();

  useEffect(() => {
    const tmpTime = parseFloat(time).toFixed(2);
    const tmpMinutes = Math.floor(tmpTime / 60) % 60;
    setMinutes(tmpMinutes);
    setSeconds(Math.floor(tmpTime - tmpMinutes * 60));
    setMseconds(parseInt(tmpTime.slice(-2)));
  }, [time]);

  function handleChange(m, s, ms) {
    setMinutes(m);
    setSeconds(s);
    setMseconds(ms);
    const t = m * 60 + s + ms / 100;
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
    if (mseconds + deltams < 100) {
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
    <div className="flex flex-row">
      <div className="flex flex-col items-center">
        <Icon
          className="cursor-pointer"
          name="caret up"
          size="big"
          onClick={handleMinutesUp}
        />
        <div>{minutes}</div>
        <Icon
          className="cursor-pointer"
          name="caret down"
          size="big"
          onClick={handleMinutesDown}
        />
      </div>
      <div className="flex flex-col items-center">
        <Icon
          className="cursor-pointer"
          name="caret up"
          size="big"
          onClick={handleSecondsUp}
        />
        <div>{seconds}</div>
        <Icon
          className="cursor-pointer"
          name="caret down"
          size="big"
          onClick={handleSecondsDown}
        />
      </div>
      <div className="flex flex-col items-center">
        <Icon
          className="cursor-pointer"
          name="caret up"
          size="big"
          onClick={handleMsecondsUp}
        />
        <div>{mseconds}</div>
        <Icon
          className="cursor-pointer"
          name="caret down"
          size="big"
          onClick={handleMsecondsDown}
        />
      </div>
    </div>
  );
}
