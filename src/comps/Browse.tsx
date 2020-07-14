import React, { useState, useRef, useEffect, ReactNode } from "react";
import { search, trending, mix } from "../lib/youtube";
import { Input, Loader, Icon } from "semantic-ui-react";
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

export enum Section {
  Search = "search",
  Trending = "trending",
  Library = "library",
  Mix = "mix"
}

interface Props {
  defaultSection: Section
  youtubeID?: string
  onSelectVideo(video: Video): void
}

interface Video {
  id: string
  image: string
  title: string
  hours?: number
  minutes?: number
}

export default function Browse({ youtubeID, defaultSection, onSelectVideo }: Props) {
  const [section, setSection] = useState(defaultSection)
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const query = useDebounce(searchText, 300);
  const searchRef = useRef<Input>(null);

  useEffect(() => {
    
  async function loadVideos() {
      switch (section) {
        case Section.Search:
          if (query) {
            doSearch(query);
          } else {
            setVideos([]);
          }
          searchRef.current?.focus();
          break;
        case Section.Trending:
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
        case Section.Mix:
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
        case Section.Library:
          try {
            setLoading(true);
            const libraryVideos = await library.videos();
            setVideos(libraryVideos);
          } catch (error) {
            console.error(error);
            setVideos([]);
            rollbar.error(error);
          } finally {
            setLoading(false);
          }
      }
    }

    loadVideos()
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
      case Section.Library:
        icon = "folder open";
        text = "Your karaoke songs will be available here";
        break;
      case Section.Search:
        icon = "search";
        text = "Start typing to search";
        break;
      case Section.Mix:
      case Section.Trending:
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
        <div>
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        <Input
          className={styles.search}
          type="text"
          onFocus={() => setSection(Section.Search)}
          onChange={(_, { value }) => setSearchText(value)}
          placeholder="Start typing to search"
          ref={searchRef}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.links}>
          <div
            className={section === Section.Search ? styles.activeLink : styles.link}
            onClick={() => setSection(Section.Search)}
          >
            Search
          </div>
          <div
            className={section === Section.Trending ? styles.activeLink : styles.link}
            onClick={() => setSection(Section.Trending)}
          >
            Trending
          </div>
          {youtubeID ? (
            <div
              className={section === Section.Mix ? styles.activeLink : styles.link}
              onClick={() => setSection(Section.Mix)}
            >
              Mix
            </div>
          ) : null}
          <div
            className={section === Section.Library ? styles.activeLink : styles.link}
            onClick={() => setSection(Section.Library)}
          >
            Library
          </div>
        </div>
        {loading ? (
          <Loader className="p-4" active inline="centered" />
        ) : (
          <VideoList videos={videos} onSelect={onSelectVideo} />
        )}
        {renderEmpty()}
        <Update />
      </div>
    </div>
  );
}
