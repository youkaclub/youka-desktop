import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { version } from "../package.json";

console.log("YOUKA_VERSION", version);
console.log("YOUKA_GIT_SHA", process.env.REACT_APP_GIT_SHA);

ReactDOM.render(<App />, document.getElementById("root"));
