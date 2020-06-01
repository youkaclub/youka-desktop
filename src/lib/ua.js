import ua from "universal-analytics";
import config from "../config";
import { user } from "./user";

const uaid = process.env.NODE_ENV === "production" ? config.ua : "";

export const visitor = ua(uaid, user);
