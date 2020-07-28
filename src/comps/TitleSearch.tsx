import React from "react";
import styles from "./TitleSearch.module.css";
import { Input } from "semantic-ui-react";

interface Props {
  searchText: string;
  onFocus?(): void;
  onSearch(text: string): void;
}

export default function TitleSearch({ searchText, onFocus, onSearch }: Props) {
  return (
    <div className={styles.title}>
      <Input
        className={styles.search}
        type="text"
        onFocus={onFocus}
        value={searchText}
        onChange={(_, { value }) => onSearch(value)}
        placeholder="Start typing to search"
      />
    </div>
  );
}
