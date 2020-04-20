import { useEffect } from "react";
import { visitor } from "./ua";

export function usePageView(path) {
  useEffect(() => {
    visitor.pageview(path).send();
  }, [path]);
}

export function useEvent(category, action, label) {
  useEffect(() => {
    visitor.event(category, action, label).send();
  }, [category, action, label]);
}
