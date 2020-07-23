import React, { useState, useRef, useEffect } from "react";
import { search, trending, mix } from "../lib/youtube";
import { Link } from "react-router-dom";
import { Input, Loader, Icon } from "semantic-ui-react";
import VideoList from "./VideoList";
import Update from "./Update";
import rollbar from "../lib/rollbar";
import * as library from "../lib/library";
import { CACHE_PATH } from "../lib/path";

const memoizeFs = require("memoize-fs");
const { shell } = require("electron");
const DAY = 1000 * 60 * 60 * 24;
const WEEK = DAY * 7;
const memoizer = memoizeFs({ cachePath: CACHE_PATH, maxAge: WEEK });

export const PLAYLIST_SEARCH = "search";
export const PLAYLIST_TRENDING = "trending";
export const PLAYLIST_LIBRARY = "library";
export const PLAYLIST_MIX = "mix";

export default function Shell({
  children,
  youtubeID,
  defaultPlaylist,
  onFocusSearch,
}) {
  const [videos, setVideos] = useState([]);
  const [playlist, setPlaylist] = useState(PLAYLIST_TRENDING);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    handlePlaylistChange(defaultPlaylist);
    // eslint-disable-next-line
  }, [youtubeID]);

  function handlePlaylistChange(pl) {
    switch (pl) {
      case PLAYLIST_SEARCH:
        handleSearch();
        break;
      case PLAYLIST_TRENDING:
        handleTrending();
        break;
      case PLAYLIST_MIX:
        handleMix();
        break;
      case PLAYLIST_LIBRARY:
        handleLibrary();
        break;
      default:
        break;
    }
  }

  function handleClickDonate() {
    shell.openExternal("https://www.patreon.com/getyouka");
  }

  function handleClickDiscord() {
    shell.openExternal("https://discord.gg/yMXv8qw");
  }

  async function handleSearch() {
    setPlaylist(PLAYLIST_SEARCH);
    doSearch();
  }

  async function handleTrending() {
    try {
      setLoading(true);
      setPlaylist(PLAYLIST_TRENDING);
      const trending_memoize = await memoizer.fn(trending);
      const results = await trending_memoize();
      setVideos(results);
      setPlaylist(PLAYLIST_TRENDING);
    } catch (error) {
      console.error(error);
      setVideos([]);
      rollbar.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMix() {
    try {
      setLoading(true);
      setPlaylist(PLAYLIST_MIX);
      const mix_memoize = await memoizer.fn(mix);
      const results = await mix_memoize(youtubeID);
      results.shift();
      setVideos(results);
      setPlaylist(PLAYLIST_MIX);
    } catch (error) {
      console.error(error);
      setVideos([]);
      rollbar.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLibrary() {
    try {
      setLoading(true);
      setPlaylist(PLAYLIST_LIBRARY);
      const libraryVideos = await library.videos();
      setVideos(libraryVideos);
      setPlaylist(PLAYLIST_LIBRARY);
    } catch (error) {
      console.error(error);
      setVideos([]);
      rollbar.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange() {
    return doSearch();
  }

  function handleSearchFocus() {
    if (onFocusSearch) onFocusSearch();
    handleSearch();
  }

  async function doSearch() {
    try {
      const query = searchRef.current.inputRef.current.value;
      if (!query || query.trim() === "") {
        setVideos([]);
        searchRef.current.focus();
        return;
      }
      setLoading(true);
      const search_memoize = await memoizer.fn(search);
      const results = await search_memoize(query);
      const filteredResults = results.filter(
        (r) => !("minutes" in r) || (!r.hours && r.minutes < 10)
      );
      if (searchRef.current) {
        const query2 = searchRef.current.inputRef.current.value;
        if (query === query2) {
          setVideos(filteredResults);
        }
      }
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

    let icon, text;
    switch (playlist) {
      case PLAYLIST_LIBRARY:
        icon = "folder open";
        text = "Your karaoke songs will be available here";
        break;
      case PLAYLIST_SEARCH:
        icon = "search";
        text = "Start typing to search";
        break;
      case PLAYLIST_MIX:
      case PLAYLIST_TRENDING:
        icon = "numbered list";
        text = "Loading playlist failed";
        break;
      default:
        break;
    }
    if (!icon || !text) return null;

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
          onChange={handleSearchChange}
          placeholder="Start typing to search"
          onFocus={handleSearchFocus}
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
          style={{ color: playlist === PLAYLIST_SEARCH ? "#E30B17" : "black" }}
          className="p-4 text-2xl cursor-pointer"
          onClick={handleSearch}
        >
          Search
        </div>
        <div
          style={{
            color: playlist === PLAYLIST_TRENDING ? "#E30B17" : "black",
          }}
          className="p-4 text-2xl cursor-pointer"
          onClick={handleTrending}
        >
          Trending
        </div>
        {youtubeID ? (
          <div
            style={{ color: playlist === PLAYLIST_MIX ? "#E30B17" : "black" }}
            className="p-4 text-2xl cursor-pointer"
            onClick={handleMix}
          >
            Mix
          </div>
        ) : null}
        <div
          style={{ color: playlist === PLAYLIST_LIBRARY ? "#E30B17" : "black" }}
          className="p-4 text-2xl cursor-pointer"
          onClick={handleLibrary}
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
