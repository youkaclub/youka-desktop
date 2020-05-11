import ua from "universal-analytics";
import config from "../config";
import store from "./store";
import { user } from "./user";

const uaid =
  process.env.NODE_ENV === "production" && store.get("stats") ? config.ua : "";

export const visitor = ua(uaid, user);

const cmd = process.argv[1];
if (cmd === "--squirrel-firstrun") {
  visitor.event("First time", "Click", user).send();
}
