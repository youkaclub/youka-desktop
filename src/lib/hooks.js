import { useEffect } from "react";
import { visitor } from "./ua";

export function usePageView(path) {
  useEffect(() => {
    visitor.pageview(path).send();
  }, [path]);
}
