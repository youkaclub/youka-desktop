import React from "react";
import ReactDOM from "react-dom";
import * as FullStory from "@fullstory/browser";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import store from "./lib/store";
import { fullstory as orgId } from "./config";
import { version } from "../package.json";

console.log("YOUKA_VERSION", version);
console.log("YOUKA_GIT_SHA", process.env.REACT_APP_GIT_SHA);

if (store.get("stats") && process.env.NODE_ENV === "production") {
  FullStory.init({ orgId });
}

ReactDOM.render(<App />, document.getElementById("root"));

serviceWorker.register();
