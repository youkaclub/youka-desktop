import { v4 as uuid4 } from "uuid";
import store from "./store";

export const user = store.get("user", uuid4());

store.set("user", user);
