import React, { useState, useRef, useEffect, ReactNode } from "react";
import { search, trending, mix } from "../lib/youtube";
import { Link } from "react-router-dom";
import { Input, Loader, Icon } from "semantic-ui-react";
import VideoList from "./VideoList";
import Update from "./Update";
import rollbar from "../lib/rollbar";
import * as library from "../lib/library";
import { CACHE_PATH } from "../lib/path";
import useDebounce from "../hooks/useDebounce";
import { SemanticICONS } from "semantic-ui-react/dist/commonjs/generic";

const memoizeFs = require("memoize-fs");
const { shell } = require("electron");

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
  children?: ReactNode
}

interface Video {
  id: string
  image: string
  title: string
  hours?: number
  minutes?: number
}

export default function Browse({ children, youtubeID, defaultSection }: Props) {
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

  function handleClickDonate() {
    shell.openExternal("https://www.patreon.com/getyouka");
  }

  function handleClickDiscord() {
    shell.openExternal("https://discord.gg/yMXv8qw");
  }

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
      <div className="flex flex-col w-full items-center p-24">
        <Icon size="massive" color="grey" name={icon} />
        <div className="m-4 font-bold text-2xl" style={{ color: "#767676" }}>
          {text}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-row w-full justify-between p-2 mb-2 bg-primary">
        <Link
          className="self-center text-white font-bold text-3xl flex-1 mx-2"
          to="/"
        >
          Youka
        </Link>
        <Input
          className="p-2 px-2 w-2/4 flex-2"
          type="text"
          onFocus={() => setSection(Section.Search)}
          onChange={(_, { value }) => setSearchText(value)}
          placeholder="Start typing to search"
          ref={searchRef}
        />
        <div className="flex flex-row justify-end self-center text-white flex-1">
          <div
            className="m-4 text-xl cursor-pointer"
            onClick={handleClickDiscord}
          >
            <Icon name="discord" />
            Discord
          </div>
          <div
            className="m-4 text-xl cursor-pointer"
            onClick={handleClickDonate}
          >
            <Icon name="heart" />
            Donate
          </div>
        </div>
      </div>
      {children}
      <div className="flex flex-row justify-center">
        <div
          style={{ color: section === Section.Search ? "#E30B17" : "black" }}
          className="p-4 text-2xl cursor-pointer"
          onClick={() => setSection(Section.Search)}
        >
          Search
        </div>
        <div
          style={{
            color: section === Section.Trending ? "#E30B17" : "black",
          }}
          className="p-4 text-2xl cursor-pointer"
          onClick={() => setSection(Section.Trending)}
        >
          Trending
        </div>
        {youtubeID ? (
          <div
            style={{ color: section === Section.Mix ? "#E30B17" : "black" }}
            className="p-4 text-2xl cursor-pointer"
          onClick={() => setSection(Section.Mix)}
          >
            Mix
          </div>
        ) : null}
        <div
          style={{ color: section === Section.Library ? "#E30B17" : "black" }}
          className="p-4 text-2xl cursor-pointer"
          onClick={() => setSection(Section.Library)}
        >
          Library
        </div>
      </div>
      {loading ? (
        <Loader className="p-4" active inline="centered" />
      ) : (
        <VideoList videos={videos} />
      )}
      {renderEmpty()}
      <Update />
    </div>
  );
}
