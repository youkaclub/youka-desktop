import React from "react";
import styles from "./TitleSearch.module.css";
import { Input } from "semantic-ui-react";

interface Props {
  onFocus?(): void;
  onSearch(text: string): void;
}

export default function TitleSearch({ onFocus, onSearch }: Props) {
  return (
    <div className={styles.title}>
      <Input
        className={styles.search}
        type="text"
        onFocus={onFocus}
        onChange={(_, { value }) => onSearch(value)}
        placeholder="Start typing to search"
      />
    </div>
  );
}
