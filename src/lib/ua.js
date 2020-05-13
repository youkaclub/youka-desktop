import ua from "universal-analytics";
import config from "../config";
import store from "./store";
import { user } from "./user";

const uaid =
  process.env.NODE_ENV === "production" && store.get("stats") ? config.ua : "";

export const visitor = ua(uaid, user);

if (!store.has("new")) {
  store.set("new", true);
  ua(config.ua, user).event("New Installation", "Click").send();
}
