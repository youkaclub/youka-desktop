import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { Message, Icon, Dropdown, Button } from "semantic-ui-react";
import { shell } from "electron";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import Shell, { PLAYLIST_MIX } from "../comps/Shell";
import Player from "../comps/Player";
import LyricsEditor from "../comps/LyricsEditor";
import { usePageView } from "../lib/hooks";
import rollbar from "../lib/rollbar";
import { platform } from "os";
const querystring = require("querystring");
const amplitude = require("amplitude-js");
const debug = require("debug")("youka:desktop");
const capitalize = require("capitalize");

export default function WatchPage() {
  let history = useHistory();
  const location = useLocation();
  usePageView(location.pathname);
  const params = querystring.parse(location.search.slice(1));
  const { id, title } = params;

  const [videoModes, setVideoModes] = useState({});
  const [captionsModes, setCaptionsModes] = useState({});
  const [videoMode, setVideoMode] = useState();
  const [captionsMode, setCaptionsMode] = useState();
  const [videoURL, setVideoURL] = useState();
  const [captionsURL, setCaptionsURL] = useState();
  const [error, setError] = useState();
  const [downloading, setDownloading] = useState();
  const [status, setStatus] = useState();
  const [lang, setLang] = useState();
  const [lyrics, setLyrics] = useState();
  const [editLyrics, setEditLyrics] = useState();
  const [pitch, setPitch] = useState(0);
  const [pitching, setPitching] = useState();
  const [changingMediaMode, setChangingMediaMode] = useState();
  const [ddoptions, setddoptions] = useState([]);
  const [ccoptions, setccoptions] = useState([]);

  const poptions = [];
  for (var i = 10; i >= -10; i--) {
    poptions.push({
      text: i,
      value: i,
    });
  }

  useEffect(() => {
    const tmpddoptions = Object.keys(videoModes).map((mode, i) => {
      return { key: i, text: capitalize(mode), value: mode };
    });
    setddoptions(tmpddoptions);

    const tmpccoptions = Object.keys(captionsModes).map((mode, i) => {
      let text;
      switch (mode) {
        case library.MODE_CAPTIONS_WORD:
          text = "On - Word Level";
          break;
        case library.MODE_CAPTIONS_LINE:
          text = "On - Line Level";
          break;
        default:
          text = capitalize(mode);
          break;
      }
      return { key: i, text, value: mode };
    });
    tmpccoptions.push({
      text: capitalize(library.MODE_CAPTIONS_OFF),
      value: library.MODE_CAPTIONS_OFF,
    });
    setccoptions(tmpccoptions);
  }, [videoModes, captionsModes, lyrics]);

  async function handleDownload(e, data) {
    setDownloading(true);
    const file = data.value;
    const obj = {
      file,
      audio: videoMode,
      captions: captionsMode,
    };
    try {
      amplitude.getInstance().logEvent("DOWNLOAD", obj);
      const fpath = await library.download(
        id,
        videoMode,
        captionsMode,
        file,
        pitch
      );
      shell.showItemInFolder(fpath);
    } catch (e) {
      setError(e.toString());
      rollbar.error(e, obj);
    } finally {
      setDownloading(false);
    }
  }

  function handleOpenSyncEditor(e, data) {
    history.push(
      `/${data.value}?id=${id}&title=${title}&videoMode=${library.MODE_MEDIA_ORIGINAL}&captionsMode=${captionsMode}`
    );
  }

  function handleStatusChanged(s) {
    setStatus(s);
  }

  async function handleChangeMedia(e, data) {
    return changeMedia(data.value);
  }

  function handleFocusSearch() {
    setVideoURL(null);
  }

  function handleChangeCaptions(e, data) {
    const mode = data.value;
    if (mode === library.MODE_CAPTIONS_OFF) {
      amplitude.getInstance().logEvent("CAPTIONS_OFF");
    }
    changeCaptions(mode);
  }

  async function changeMedia(mode, modes) {
    try {
      setChangingMediaMode(true);
      if (pitch === 0) {
        const m = modes || videoModes;
        const url = m[mode];
        if (url) {
          setVideoMode(mode);
          setVideoURL(url);
        }
      } else {
        await changePitch(pitch, mode);
        setVideoMode(mode);
      }
    } catch (e) {
      console.log(e);
      rollbar.error(e);
    } finally {
      setChangingMediaMode(false);
    }
  }

  function changeCaptions(mode, modes) {
    const m = modes || captionsModes;
    let url = m[mode];
    setCaptionsMode(mode);
    setCaptionsURL(url);
  }

  async function changePitch(n, mode) {
    try {
      setPitch(n);
      setPitching(true);
      let url = await library.getPitch(id, mode, n);
      url = url + `?r=${Math.random()}`;
      setVideoURL(url);
    } catch (e) {
      console.log(e);
      rollbar.error(e);
    } finally {
      setPitching(false);
    }
  }

  function handleEditLyrics() {
    setEditLyrics(!editLyrics);
  }

  async function handleChangePitch(e, data) {
    return changePitch(data.value, videoMode);
  }

  async function handleSynced(mode) {
    init(mode);
  }

  async function init(customCaptionsMode) {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setVideoURL(null);
      setLang(null);
      setCaptionsURL(null);
      setDownloading(false);
      setPitch(0);
      setError(null);
      setStatus(null);
      setEditLyrics(null);
      let files = await library.files(id);
      if (!files) {
        const start = new Date();
        await karaoke.generate(id, title, handleStatusChanged);
        const end = new Date();
        const duration = Math.abs((end.getTime() - start.getTime()) / 1000);
        debug("generate time", duration);
        amplitude.getInstance().logEvent("CREATE_KARAOKE", { duration });
        files = await library.files(id);
      }
      setVideoModes(files.videos);
      setCaptionsModes(files.captions);

      let currVideo;
      if (params.videoMode) {
        currVideo = params.videoMode;
      } else {
        currVideo = library.MODE_MEDIA_INSTRUMENTS;
      }

      handleStatusChanged("Searching lyrics");
      const lyr = await library.getLyrics(id, title);
      const lng = await library.getLanguage(id, lyr);
      setLang(lng);

      let currCaptions;
      if (customCaptionsMode) {
        currCaptions = customCaptionsMode;
      } else if (params.captionsMode) {
        currCaptions = params.captionsMode;
      } else if (library.MODE_CAPTIONS_WORD in files.captions) {
        currCaptions = library.MODE_CAPTIONS_WORD;
      } else if (library.MODE_CAPTIONS_LINE in files.captions) {
        currCaptions = library.MODE_CAPTIONS_LINE;
      } else {
        currCaptions = library.MODE_CAPTIONS_OFF;
      }

      setVideoMode(currVideo);
      setCaptionsMode(currCaptions);
      setVideoURL(files.videos[currVideo]);
      setCaptionsURL(files.captions[currCaptions]);
      setLyrics(lyr);
      setStatus(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.log(error);
      setError(error.toString());
      rollbar.error(error);
    } finally {
      setStatus(null);
    }
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line
  }, [id]);

  if (!id) return null;

  return (
    <Shell
      youtubeID={id}
      defaultPlaylist={PLAYLIST_MIX}
      onFocusSearch={handleFocusSearch}
    >
      <div className="flex flex-col items-center">
        <div className="w-2/4 mb-2">
          {error ? (
            <Message icon negative>
              <Icon name="exclamation circle" />
              <Message.Content>
                <Message.Header>Karaoke processing is failed</Message.Header>
                <div className="py-1">{error}</div>
              </Message.Content>
            </Message>
          ) : null}
          {status ? (
            <Message icon>
              <Icon name="circle notched" loading />
              <Message.Content>
                <Message.Header>{title}</Message.Header>
                <div className="py-2">{status}</div>
              </Message.Content>
            </Message>
          ) : null}
        </div>
        {videoURL ? (
          <div className="flex flex-col justify-center">
            <Player
              youtubeID={id}
              videoURL={videoURL}
              captionsURL={captionsURL}
              title={title}
              lang={lang}
            />
            <div className="flex flex-row w-full p-2 justify-center">
              <div className="flex flex-row p-2 mx-4">
                <Dropdown
                  button
                  disabled={downloading}
                  loading={downloading}
                  text="Download"
                  selectOnBlur={false}
                  value={null}
                  onChange={handleDownload}
                  options={[
                    {
                      text: "Audio",
                      value: library.FILE_MP3,
                    },
                    {
                      text: "Video",
                      value: library.FILE_MP4,
                    },
                  ]}
                />
                <Dropdown
                  button
                  text={" Audio: " + capitalize(videoMode)}
                  value={videoMode}
                  options={ddoptions}
                  disabled={changingMediaMode}
                  loading={changingMediaMode}
                  onChange={handleChangeMedia}
                />
                <Dropdown
                  button
                  text={" Lyrics Sync: " + capitalize(captionsMode)}
                  value={captionsMode}
                  options={ccoptions}
                  onChange={handleChangeCaptions}
                />
                {platform() === "win32" ||
                process.env.NODE_ENV !== "production" ? (
                  <Dropdown
                    button
                    text={`Key: ${pitch}`}
                    value={pitch}
                    options={poptions}
                    disabled={pitching}
                    loading={pitching}
                    onChange={handleChangePitch}
                  />
                ) : null}
                <Button content="Lyrics Editor" onClick={handleEditLyrics} />
                {lyrics ? (
                  <Dropdown
                    button
                    text="Sync Editor"
                    value={null}
                    selectOnBlur={false}
                    options={[
                      {
                        text: "Simple",
                        value: "sync-simple",
                      },
                      {
                        text: "Advanced",
                        value: "sync-advanced",
                        disabled:
                          !captionsURL ||
                          !captionsURL.startsWith("[Script Info]"),
                      },
                    ]}
                    onChange={handleOpenSyncEditor}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {editLyrics ? <LyricsEditor id={id} onSynced={handleSynced} /> : null}
      </div>
    </Shell>
  );
}
