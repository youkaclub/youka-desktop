import React, { useState, useEffect } from "react";
import { search, trending, mix } from "../lib/youtube";
import { Loader, Icon } from "semantic-ui-react";
import VideoList from "./VideoList";
import Update from "./Update";
import rollbar from "../lib/rollbar";
import * as library from "../lib/library";
import { CACHE_PATH } from "../lib/path";
import useDebounce from "../hooks/useDebounce";
import { SemanticICONS } from "semantic-ui-react/dist/commonjs/generic";
import styles from "./Browse.module.css";

const memoizeFs = require("memoize-fs");

const DAY = 1000 * 60 * 60 * 24;
const WEEK = DAY * 7;
const memoizer = memoizeFs({ cachePath: CACHE_PATH, maxAge: WEEK });

export enum BrowseSection {
  Search = "search",
  Trending = "trending",
  Library = "library",
  Mix = "mix",
}

interface Props {
  section: BrowseSection;
  youtubeID?: string;
  searchText: string;
  onSwitchSection(section: BrowseSection): void;
  onSelectVideo(video: Video): void;
}

interface Video {
  id: string;
  image: string;
  title: string;
  hours?: number;
  minutes?: number;
}

export default function Browse({
  youtubeID,
  section,
  searchText,
  onSwitchSection,
  onSelectVideo,
}: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const query = useDebounce(searchText, 300);

  useEffect(() => {
    async function loadVideos() {
      switch (section) {
        case BrowseSection.Search:
          if (query) {
            doSearch(query);
          } else {
            setVideos([]);
          }
          break;
        case BrowseSection.Trending:
          try {
            setLoading(true);
            const trendingMemoize = await memoizer.fn(trending);
            const results = await trendingMemoize();
            setVideos(results);
          } catch (error) {
            console.error(error);
            setVideos([]);
            rollbar.error(error);
          } finally {
            setLoading(false);
          }
          break;
        case BrowseSection.Mix:
          try {
            setLoading(true);
            const mixMemoize = await memoizer.fn(mix);
            const results = await mixMemoize(youtubeID);
            results.shift();
            setVideos(results);
          } catch (error) {
            console.error(error);
            setVideos([]);
            rollbar.error(error);
          } finally {
            setLoading(false);
          }
          break;
        case BrowseSection.Library:
          try {
            setLoading(true);
            const libraryVideos = await library.videos();
            setVideos(libraryVideos);
            console.log({ libraryVideos });
          } catch (error) {
            console.error(error);
            setVideos([]);
            rollbar.error(error);
          } finally {
            setLoading(false);
          }
      }
    }

    loadVideos();
  }, [section, youtubeID, query]);

  async function doSearch(query: string) {
    try {
      setLoading(true);
      const searchMemoize = await memoizer.fn(search);
      const results = await searchMemoize(query);
      const filteredResults = results.filter(
        (r: Video) => r.minutes === undefined || (!r.hours && r.minutes < 10)
      );
      setVideos(filteredResults);
    } catch (error) {
      console.error(error);
      setVideos([]);
      rollbar.error(error);
    } finally {
      setLoading(false);
    }
  }

  function renderEmpty() {
    if (videos && videos.length) return null;
    if (loading) return null;

    let icon: SemanticICONS, text: string;
    switch (section) {
      case BrowseSection.Library:
        icon = "folder open";
        text = "Your karaoke songs will be available here";
        break;
      case BrowseSection.Search:
        icon = "search";
        text = "Start typing to search";
        break;
      case BrowseSection.Mix:
      case BrowseSection.Trending:
        icon = "numbered list";
        text = "Loading playlist failed";
        break;
      default:
        return null;
    }

    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <Icon size="massive" color="grey" name={icon} />
        </div>
        <div>{text}</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.links}>
        <div
          className={
            section === BrowseSection.Search ? styles.activeLink : styles.link
          }
          onClick={() => onSwitchSection(BrowseSection.Search)}
        >
          Search
        </div>
        <div
          className={
            section === BrowseSection.Trending ? styles.activeLink : styles.link
          }
          onClick={() => onSwitchSection(BrowseSection.Trending)}
        >
          Trending
        </div>
        {youtubeID ? (
          <div
            className={
              section === BrowseSection.Mix ? styles.activeLink : styles.link
            }
            onClick={() => onSwitchSection(BrowseSection.Mix)}
          >
            Mix
          </div>
        ) : null}
        <div
          className={
            section === BrowseSection.Library ? styles.activeLink : styles.link
          }
          onClick={() => onSwitchSection(BrowseSection.Library)}
        >
          Library
        </div>
      </div>
      <div className={styles.videos}>
        {loading ? (
          <Loader className="p-4" active inline="centered" />
        ) : (
          <VideoList kind="vertical" videos={videos} onSelect={onSelectVideo} />
        )}
        {renderEmpty()}
      </div>
      <Update />
    </div>
  );
}
