import React, { useEffect, useState } from "react";
import { Message, Icon, Dropdown, Button } from "semantic-ui-react";
import { shell } from "electron";
import * as library from "../lib/library";
import Player from "./Player";
import LyricsEditor from "./LyricsEditor";
import rollbar from "../lib/rollbar";
import { platform } from "os";
import { useHistory } from "react-router-dom";
import { Video } from "../lib/video";
import styles from "./VideoPlayer.module.css";
const amplitude = require("amplitude-js");
const capitalize = require("capitalize");

interface Props {
  video: Video;
  defaultVideoMode?: library.MediaMode;
  defaultCaptionsMode?: library.CaptionsMode;
  processingStatus?: string;
  onEnded?(): void;
}

interface Option {
  key: number;
  text: string;
  value: string;
}

export default function VideoPlayer({
  video,
  defaultVideoMode,
  defaultCaptionsMode,
  processingStatus,
  onEnded,
}: Props) {
  const { id, title } = video;
  const history = useHistory();
  const [videoModes, setVideoModes] = useState<library.MediaUrls>({});
  const [captionsModes, setCaptionsModes] = useState<library.CaptionUrls>({});
  const [videoMode, setVideoMode] = useState<library.MediaMode>();
  const [captionsMode, setCaptionsMode] = useState<library.CaptionsMode>();
  const [videoURL, setVideoURL] = useState<string>();
  const [captionsURL, setCaptionsURL] = useState<string>();
  const [error, setError] = useState<string>();
  const [downloading, setDownloading] = useState<boolean>();
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
    const tmpddoptions: Option[] = Object.keys(videoModes).map((mode, i) => {
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

  async function handleDownload(file: string): Promise<void> {
    setDownloading(true);
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

  function openSyncEditor(value: string): void {
    history.push(
      `/${value}?id=${id}&title=${title}&videoMode=${library.MediaMode.Original}&captionsMode=${captionsMode}`
    );
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

  function handleEditLyrics(): void {
    setEditLyrics(!editLyrics);
  }

  function handleSynced(mode: library.CaptionsMode): void {
    loadVideo(mode);
  }

  async function init() {
    setVideoURL(undefined);
    setLang(undefined);
    setCaptionsURL(undefined);
    setDownloading(false);
    setPitch(0);
    setError(undefined);
    setEditLyrics(undefined);
    await loadVideo();
  }

  async function loadVideo(customCaptionsMode?: library.CaptionsMode) {
    const files = await library.files(id);
    if (!files) return;

    setVideoModes(files.videos);
    setCaptionsModes(files.captions);

    let currVideo: library.MediaMode;
    if (defaultVideoMode) {
      currVideo = defaultVideoMode;
    } else {
      currVideo = library.MediaMode.Instruments;
    }

    const lyr = await library.getLyrics(id, title);
    if (lyr) {
      const lng = await library.getLanguage(id, lyr);
      setLang(lng);
    }

    let currCaptions: library.CaptionsMode;
    if (customCaptionsMode) {
      currCaptions = customCaptionsMode;
    } else if (defaultCaptionsMode) {
      currCaptions = defaultCaptionsMode;
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
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line
  }, [id]);
  useEffect(() => {
    if (!videoURL) {
      loadVideo();
    }
    // eslint-disable-next-line
  }, [processingStatus]);

  if (!id) return null;

  return (
    <div className={styles.wrapper}>
      {videoURL && (
        <div className={styles.toolbar}>
          <Dropdown
            button
            disabled={downloading}
            loading={downloading}
            text="Download"
            selectOnBlur={false}
            onChange={(_, { value }) => handleDownload(String(value))}
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
            value={videoMode || undefined}
            options={ddoptions}
            disabled={changingMediaMode}
            loading={changingMediaMode}
            onChange={(_, { value }) =>
              changeMedia(String(value) as library.MediaMode)
            }
          />
          <Dropdown
            button
            text={" Lyrics Sync: " + capitalize(captionsMode)}
            value={captionsMode}
            options={ccoptions}
            onChange={(_, { value }) =>
              changeCaptions(String(value) as library.CaptionsMode)
            }
          />
          {platform() === "win32" || process.env.NODE_ENV !== "production" ? (
            <Dropdown
              button
              text={`Key: ${pitch}`}
              value={pitch}
              options={poptions}
              disabled={pitching}
              loading={pitching}
              onChange={(_, { value }) => {
                if (videoMode) {
                  changePitch(Number(value), videoMode);
                }
              }}
            />
          ) : null}
          <Button content="Lyrics Editor" onClick={handleEditLyrics} />
          {lyrics && (
            <Dropdown
              button
              text="Sync Editor"
              options={[
                {
                  text: "Simple",
                  value: "sync-simple",
                },
                {
                  text: "Advanced",
                  value: "sync-advanced",
                  disabled:
                    !captionsURL || !captionsURL.startsWith("[Script Info]"),
                },
              ]}
              onChange={(_, { value }) => openSyncEditor(String(value))}
            />
          )}
        </div>
      )}
      {(error || processingStatus) && (
        <div className={styles.message}>
          {error ? (
            <Message icon negative>
              <Icon name="exclamation circle" />
              <Message.Content>
                <Message.Header>Karaoke processing is failed</Message.Header>
                <div className="py-1">{error}</div>
              </Message.Content>
            </Message>
          ) : null}
          {processingStatus && (
            <Message icon>
              <Icon name="circle notched" loading />
              <Message.Content>
                <Message.Header>{title}</Message.Header>
                <div className="py-2">{processingStatus}</div>
              </Message.Content>
            </Message>
          )}
        </div>
      )}
      {videoURL && (
        <Player
          className={styles.video}
          youtubeID={id}
          videoURL={videoURL}
          captionsURL={captionsURL}
          lang={lang}
          onEnded={onEnded}
        />
      )}
      {videoURL && <div className={styles.title}>{title}</div>}
      {editLyrics && (
        <div className={styles.subPane}>
          <LyricsEditor id={id} onSynced={handleSynced} />
        </div>
      )}
    </div>
  );
}
