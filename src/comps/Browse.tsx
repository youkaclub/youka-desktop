import React, { useState, useEffect, ReactNode } from "react";
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
import { ProcessingStatus } from "../lib/playback";

const memoizeFs = require("memoize-fs");

const DAY = 1000 * 60 * 60 * 24;
const WEEK = DAY * 7;
const memoizer = memoizeFs({ cachePath: CACHE_PATH, maxAge: WEEK });

export enum BrowseSection {
  Search = "search",
  Trending = "trending",
  Library = "library",
  Mix = "mix",
  Queue = "queue",
}

interface Props {
  section: BrowseSection;
  youtubeID?: string;
  searchText: string;
  nowPlaying?: Video;
  queue: Video[];
  processingStatus?: ProcessingStatus;
  onSwitchSection(section: BrowseSection): void;
  onPlayVideo(video: Video): void;
  onQueueVideo(video: Video): void;
  onUnqueueVideo(video: Video): void;
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
  nowPlaying,
  queue,
  onSwitchSection,
  onPlayVideo,
  onQueueVideo,
  onUnqueueVideo,
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.links}>
        <SectionLink
          section={BrowseSection.Search}
          currentSection={section}
          onSwitchSection={onSwitchSection}
        >
          Search
        </SectionLink>
        {youtubeID && (
          <SectionLink
            section={BrowseSection.Mix}
            currentSection={section}
            onSwitchSection={onSwitchSection}
          >
            Mix
          </SectionLink>
        )}
        <SectionLink
          section={BrowseSection.Library}
          currentSection={section}
          onSwitchSection={onSwitchSection}
        >
          Library
        </SectionLink>
        {queue.length > 0 && (
          <SectionLink
            section={BrowseSection.Queue}
            currentSection={section}
            onSwitchSection={onSwitchSection}
          >
            Queue
          </SectionLink>
        )}
      </div>
      <div className={styles.videos}>
        {loading ? (
          <Loader className="p-4" active inline="centered" />
        ) : (
          <VideoList
            kind="vertical"
            nowPlaying={nowPlaying}
            queue={queue}
            videos={section === BrowseSection.Queue ? queue : videos}
            onSelect={onPlayVideo}
            onQueue={onQueueVideo}
            onUnqueue={onUnqueueVideo}
          />
        )}
        {videos.length === 0 && !loading && <ZeroState section={section} />}
      </div>
      <Update />
    </div>
  );
}

function SectionLink({
  section,
  currentSection,
  onSwitchSection,
  children,
}: {
  section: BrowseSection;
  currentSection: BrowseSection;
  onSwitchSection(section: BrowseSection): void;
  children: ReactNode;
}) {
  return (
    <div
      className={section === currentSection ? styles.activeLink : styles.link}
      onClick={() => onSwitchSection(section)}
    >
      {children}
    </div>
  );
}

function ZeroState({ section }: { section: BrowseSection }) {
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
      text = "Loading videos failed";
      break;
    case BrowseSection.Queue:
      icon = "list";
      text = "Queue empty";
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
