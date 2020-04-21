import React, { useState, useEffect, useRef } from "react";
import { Message } from "semantic-ui-react";
import * as serviceWorker from "../serviceWorker";

const debug = require("debug")("youka:desktop");

export default function Update() {
  const [visible, setVisible] = useState(false);
  const reg = useRef();

  function handleReload() {
    if (reg.current && reg.current.waiting) {
      debug("skip waiting");
      reg.current.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload(true);
  }

  useEffect(() => {
    function onUpdate(r) {
      debug("update available");
      setVisible(true);
      reg.current = r;
    }
    debug("register service worker");
    serviceWorker.register({ onUpdate });
  }, []);

  if (!visible) return null;

  return (
    <div
      className="cursor-pointer fixed bottom-0 w-screen text-center"
      onClick={handleReload}
    >
      <Message color="blue">Update is ready - Click to reload</Message>
    </div>
  );
}
