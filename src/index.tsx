import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { version } from "../package.json";
import store from "./lib/store";
const amplitude = require("amplitude-js");
const config = require("./config");

console.log("YOUKA_VERSION", version);
console.log("YOUKA_GIT_SHA", process.env.REACT_APP_GIT_SHA);

if (config.amplitude) {
  amplitude.getInstance().init(config.amplitude);
  amplitude.getInstance().logEvent("OPEN_APP");

  if (!store.has("new")) {
    store.set("new", true);
    amplitude.getInstance().logEvent("NEW_INSTALLATION");
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
