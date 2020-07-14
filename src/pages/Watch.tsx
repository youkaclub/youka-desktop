import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { Message, Icon, Dropdown, Button } from "semantic-ui-react";
import { shell } from "electron";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import Browse, { Section } from "../comps/Browse";
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

  const [videoModes, setVideoModes] = useState<library.MediaUrls>({});
  const [captionsModes, setCaptionsModes] = useState<library.CaptionUrls>({});
  const [videoMode, setVideoMode] = useState<library.MediaMode>();
  const [captionsMode, setCaptionsMode] = useState<library.CaptionsMode>();
  const [videoURL, setVideoURL] = useState<string>();
  const [captionsURL, setCaptionsURL] = useState<string>();
  const [error, setError] = useState<string>();
  const [downloading, setDownloading] = useState<boolean>();
  const [status, setStatus] = useState<string>();
  const [lang, setLang] = useState<string>();
  const [lyrics, setLyrics] = useState<string>();
  const [editLyrics, setEditLyrics] = useState<boolean>();
  const [pitch, setPitch] = useState<number>(0);
  const [pitching, setPitching] = useState<boolean>();
  const [changingMediaMode, setChangingMediaMode] = useState<boolean>();
  const [ddoptions, setddoptions] = useState<any[]>([]);
  const [ccoptions, setccoptions] = useState<any[]>([]);

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
        case library.CaptionsMode.Word:
          text = "On - Word Level";
          break;
        case library.CaptionsMode.Line:
          text = "On - Line Level";
          break;
        default:
          text = capitalize(mode);
          break;
      }
      return { key: i, text, value: mode };
    });
    tmpccoptions.push({
      key: -1,
      text: capitalize(library.CaptionsMode.Off),
      value: library.CaptionsMode.Off,
    });
    setccoptions(tmpccoptions);
  }, [videoModes, captionsModes, lyrics]);

  async function handleDownload(_: unknown, data: any) {
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
        videoMode!,
        captionsMode!,
        file as library.FileType,
        pitch
      );
      shell.showItemInFolder(fpath!);
    } catch (e) {
      setError(e.toString());
      rollbar.error(e, obj);
    } finally {
      setDownloading(false);
    }
  }

  function handleOpenSyncEditor(_: unknown, data: any) {
    history.push(
      `/${data.value}?id=${id}&title=${title}&videoMode=${library.MediaMode.Original}&captionsMode=${captionsMode}`
    );
  }

  function handleStatusChanged(s: string) {
    setStatus(s);
  }

  async function handleChangeMedia(_: unknown, data: any) {
    return changeMedia(data.value);
  }

  function handleFocusSearch() {
    setVideoURL(undefined);
  }

  function handleChangeCaptions(_: unknown, data: any) {
    const mode = data.value;
    if (mode === library.CaptionsMode.Off) {
      amplitude.getInstance().logEvent("CAPTIONS_OFF");
    }
    changeCaptions(mode);
  }

  async function changeMedia(
    mode: library.MediaMode,
    modes?: library.MediaUrls
  ) {
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

  function changeCaptions(
    mode: library.CaptionsMode,
    modes?: library.CaptionUrls
  ) {
    const m = modes || captionsModes;
    let url = m[mode];
    setCaptionsMode(mode);
    setCaptionsURL(url);
  }

  async function changePitch(n: number, mode: library.MediaMode) {
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

  async function handleChangePitch(_: unknown, data: any) {
    return changePitch(Number(data.value), videoMode!);
  }

  async function handleSynced(mode: library.CaptionsMode) {
    init(mode);
  }

  async function init(customCaptionsMode?: library.CaptionsMode) {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setVideoURL(undefined);
      setLang(undefined);
      setCaptionsURL(undefined);
      setDownloading(false);
      setPitch(0);
      setError(undefined);
      setStatus(undefined);
      setEditLyrics(undefined);
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
      if (files) {
        setVideoModes(files.videos);
        setCaptionsModes(files.captions);
      }

      let currVideo: library.MediaMode;
      if (params.videoMode) {
        currVideo = params.videoMode;
      } else {
        currVideo = library.MediaMode.Instruments;
      }

      handleStatusChanged("Searching lyrics");
      const lyr = await library.getLyrics(id, title);
      if (lyr) {
        const lng = await library.getLanguage(id, lyr);
        setLang(lng);
      }

      let currCaptions: library.CaptionsMode;
      if (customCaptionsMode) {
        currCaptions = customCaptionsMode;
      } else if (params.captionsMode) {
        currCaptions = params.captionsMode;
      } else if (files && library.CaptionsMode.Word in files.captions) {
        currCaptions = library.CaptionsMode.Word;
      } else if (files && library.CaptionsMode.Line in files.captions) {
        currCaptions = library.CaptionsMode.Line;
      } else {
        currCaptions = library.CaptionsMode.Off;
      }

      setVideoMode(currVideo);
      setCaptionsMode(currCaptions);
      setVideoURL(files && files.videos[currVideo]);
      setCaptionsURL(files && files.captions[currCaptions]);
      setLyrics(lyr);
      setStatus(undefined);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.log(error);
      setError(error.toString());
      rollbar.error(error);
    } finally {
      setStatus(undefined);
    }
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line
  }, [id]);

  if (!id) return null;

  return (
    <Browse youtubeID={id} defaultPlaylist={Section.Mix}>
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
                  value={undefined}
                  onChange={handleDownload}
                  options={[
                    {
                      text: "Audio",
                      value: library.FileType.MP3,
                    },
                    {
                      text: "Video",
                      value: library.FileType.MP4,
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
                    value={undefined}
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
    </Browse>
  );
}
