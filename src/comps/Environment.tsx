import React, { ReactNode } from "react";
import styles from "./Environment.module.css";

export function Environment({ children }: { children: ReactNode}) {
  return <div className={styles.wrapper}>
    {children}
  </div>
}
