import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "semantic-ui-react";
import styles from "./TitleBar.module.css";
const { shell } = require("electron");

export default function TitleBar() {
  function handleClickDonate() {
    shell.openExternal("https://www.patreon.com/getyouka");
  }

  function handleClickDiscord() {
    shell.openExternal("https://discord.gg/yMXv8qw");
  }

  return <div className={styles.wrapper}>
    <div className={styles.left} />
    <Link
      className={styles.logo}
      to="/"
    >
      Youka
    </Link>
    <div className={styles.links}>
      <div
        className={styles.link}
        onClick={handleClickDiscord}
      >
        <Icon name="discord" />
        Discord
      </div>
      <div
        className={styles.link}
        onClick={handleClickDonate}
      >
        <Icon name="heart" />
        Donate
      </div>
    </div>
  </div>
}
