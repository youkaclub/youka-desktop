import React, { useEffect, useState } from "react";
import { Message, Icon, Dropdown, Button } from "semantic-ui-react";
import { shell } from "electron";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import Player from "../comps/Player";
import LyricsEditor from "../comps/LyricsEditor";
import rollbar from "../lib/rollbar";
import { platform } from "os";
import { useHistory } from "react-router-dom";
const amplitude = require("amplitude-js");
const debug = require("debug")("youka:desktop");
const capitalize = require("capitalize");

interface Props {
  id: string
  title: string
  defaultVideoMode?: string
  defaultCaptionsMode?: string
}

interface Option {
  key: number
  text: string
  value: string
}

interface Files {
  videos: Record<string, string>
  captions: Record<string,string>
}

export default function Video({ id, title, defaultVideoMode, defaultCaptionsMode }: Props) {
  const history = useHistory();
  const [videoModes, setVideoModes] = useState<Record<string, string>>({});
  const [captionsModes, setCaptionsModes] = useState<Record<string, string>>({});
  const [videoMode, setVideoMode] = useState<string | undefined>(defaultVideoMode);
  const [captionsMode, setCaptionsMode] = useState<string | undefined>(defaultCaptionsMode);
  const [videoURL, setVideoURL] = useState<string | undefined>(undefined);
  const [captionsURL, setCaptionsURL] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [lyrics, setLyrics] = useState<string | undefined>(undefined);
  const [editLyrics, setEditLyrics] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [pitching, setPitching] = useState(false);
  const [changingMediaMode, setChangingMediaMode] = useState(false);
  const [ddoptions, setddoptions] = useState<Option[]>([]);
  const [ccoptions, setccoptions] = useState<Option[]>([]);

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

    const tmpccoptions: Option[] = Object.keys(captionsModes).map((mode, i) => {
      return { key: i, text: capitalize(mode), value: mode };
    });
    if (lyrics) {
      tmpccoptions.push({
        key: tmpccoptions.length,
        text: capitalize(library.MODE_CAPTIONS_FULL),
        value: library.MODE_CAPTIONS_FULL,
      });
    }
    tmpccoptions.push({
      key: tmpccoptions.length,
      text: capitalize(library.MODE_CAPTIONS_OFF),
      value: library.MODE_CAPTIONS_OFF,
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
        videoMode,
        captionsMode,
        file,
        pitch
      );
      if (fpath) {
        shell.showItemInFolder(fpath);
      }
    } catch (e) {
      setError(e.toString());
      rollbar.error(e, obj);
    } finally {
      setDownloading(false);
    }
  }

  function openSyncEditor(value: string): void {
    history.push(
      `/${value}?id=${id}&title=${title}&videoMode=${library.MODE_MEDIA_ORIGINAL}&captionsMode=${captionsMode}`
    );
  }

  function handleClickClose() {
    setVideoURL(undefined);
    setEditLyrics(false);
  }

  async function changeMedia(mode: string, modes?: Record<string, string>) {
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

  function changeCaptions(mode: string, modes?: Record<string, string>) {
    if (mode === library.MODE_CAPTIONS_OFF) {
      amplitude.getInstance().logEvent("CAPTIONS_OFF");
    }
    const m = modes || captionsModes;
    let url = m[mode];
    setCaptionsMode(mode);
    setCaptionsURL(url);
  }

  async function changePitch(n: number, mode?: string) {
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

  function handleSynced(mode: string): void {
    init(mode);
  }

  async function init(customCaptionsMode?: string) {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setVideoURL(undefined);
      setDownloading(false);
      setPitch(0);
      setError(undefined);
      setStatus(undefined);
      
      let files = await library.files(id) as Files | null;
      if (!files) {
        const start = new Date();
        await karaoke.generate(id, title, setStatus);
        const end = new Date();
        const duration = Math.abs((end.getTime() - start.getTime()) / 1000);
        debug("generate time", duration);
        amplitude.getInstance().logEvent("CREATE_KARAOKE", { duration });
        files = await library.files(id) as Files;
      }
      setVideoModes(files.videos);
      setCaptionsModes(files.captions);

      let currVideo;
      if (defaultVideoMode) {
        currVideo = defaultVideoMode;
      } else {
        currVideo = library.MODE_MEDIA_INSTRUMENTS;
      }

      setStatus("Searching lyrics");
      const lyr = await library.getLyrics(id, title);

      let currCaptions;
      if (customCaptionsMode) {
        currCaptions = customCaptionsMode;
      } else if (defaultCaptionsMode) {
        currCaptions = defaultCaptionsMode;
      } else if (library.MODE_CAPTIONS_WORD in files.captions) {
        currCaptions = library.MODE_CAPTIONS_WORD;
      } else if (library.MODE_CAPTIONS_LINE in files.captions) {
        currCaptions = library.MODE_CAPTIONS_LINE;
      } else if (lyr) {
        currCaptions = library.MODE_CAPTIONS_FULL;
      } else {
        currCaptions = library.MODE_CAPTIONS_OFF;
      }

      setVideoMode(currVideo);
      setCaptionsMode(currCaptions);
      setVideoURL(files.videos[currVideo]);
      setCaptionsURL(files.captions[currCaptions]);
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
          />
          <div className="flex flex-row w-full p-2 justify-center">
            <div className="flex flex-row p-2 mx-4">
              <Button content="Close Video" onClick={handleClickClose} />
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
                value={videoMode || undefined}
                options={ddoptions}
                disabled={changingMediaMode}
                loading={changingMediaMode}
                onChange={(_, { value }) => changeMedia(String(value))}
              />
              <Dropdown
                button
                text={" Lyrics Sync: " + capitalize(captionsMode)}
                value={captionsMode}
                options={ccoptions}
                onChange={(_, { value }) => changeCaptions(String(value))}
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
                  onChange={(_, { value }) => changePitch(Number(value), videoMode)}
                />
              ) : null}
              <Button content="Lyrics Editor" onClick={handleEditLyrics} />
              {lyrics ? (
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
                        !captionsURL ||
                        !captionsURL.startsWith("[Script Info]"),
                    },
                  ]}
                  onChange={(_, { value }) => openSyncEditor(String(value))}
                />
              ) : null}
            </div>
          </div>
          {captionsMode === library.MODE_CAPTIONS_FULL && lyrics ? (
            <div className="flex justify-center mx-4 p-2">
              <div className="text-2xl leading-normal">
                {lyrics.split("\n").map((line, i) => (
                  <div key={i}>
                    {line}
                    <br></br>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {editLyrics ? <LyricsEditor id={id} onSynced={handleSynced} /> : null}
    </div>
  );
}
