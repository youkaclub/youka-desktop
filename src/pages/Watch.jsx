import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  Message,
  Icon,
  Dropdown,
  Button,
  Form,
  TextArea,
} from "semantic-ui-react";
import { shell } from "electron";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import Shell, { PLAYLIST_MIX } from "../comps/Shell";
import Player from "../comps/Player";
import { usePageView } from "../lib/hooks";
import rollbar from "../lib/rollbar";
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

  const defaultVideo = library.MODE_MEDIA_INSTRUMENTS;

  const [videoModes, setVideoModes] = useState({});
  const [captionsModes, setCaptionsModes] = useState({});
  const [videoMode, setVideoMode] = useState(defaultVideo);
  const [captionsMode, setCaptionsMode] = useState();
  const [videoURL, setVideoURL] = useState();
  const [captionsURL, setCaptionsURL] = useState();
  const [error, setError] = useState();
  const [progress, setProgress] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [realigning, setRealigning] = useState(false);
  const [status, setStatus] = useState();
  const [lyrics, setLyrics] = useState();
  const [editLyricsOpen, setEditLyricsOpen] = useState();
  const [ddoptions, setddoptions] = useState([]);
  const [ccoptions, setccoptions] = useState([]);

  useEffect(() => {
    const tmpddoptions = Object.keys(videoModes).map((mode, i) => {
      return { key: i, text: capitalize(mode), value: mode };
    });
    setddoptions(tmpddoptions);

    const tmpccoptions = Object.keys(captionsModes).map((mode, i) => {
      return { key: i, text: capitalize(mode), value: mode };
    });
    if (lyrics) {
      tmpccoptions.push({
        text: capitalize(library.MODE_CAPTIONS_FULL),
        value: library.MODE_CAPTIONS_FULL,
      });
    }
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
      const fpath = await library.download(id, videoMode, captionsMode, file);
      shell.showItemInFolder(fpath);
    } catch (e) {
      setError(e.toString());
      rollbar.error(e, obj);
    } finally {
      setDownloading(false);
    }
  }

  function handleEditLyrics() {
    setEditLyricsOpen(!editLyricsOpen);
  }

  async function handleLyricsChange(e, data) {
    setLyrics(data.value);
    return library.setLyrics(id, data.value);
  }

  function handleOpenSyncEditor() {
    const vmode = [
      library.MODE_MEDIA_ORIGINAL,
      library.MODE_MEDIA_VOCALS,
    ].includes(videoMode)
      ? videoMode
      : library.MODE_MEDIA_ORIGINAL;
    history.push(
      `/sync?id=${id}&title=${title}&videoMode=${vmode}&captionsMode=${captionsMode}`
    );
  }

  function handleStatusChanged(s) {
    setStatus(s);
  }

  function handleCloseError() {
    setError(null);
  }

  function handleClickClose() {
    setVideoURL(null);
  }

  function handleChangeVideo(e, data) {
    changeVideo(data.value);
  }

  function handleChangeCaptions(e, data) {
    changeCaptions(data.value);
  }

  function changeVideo(mode, modes) {
    const m = modes || videoModes;
    const url = m[mode];
    if (url) {
      setVideoMode(mode);
      setVideoURL(url);
    }
  }

  function changeCaptions(mode, modes) {
    const m = modes || captionsModes;
    const url = m[mode];
    setCaptionsMode(mode);
    setCaptionsURL(url);
  }

  function handleRetry() {
    window.location.reload();
  }

  async function handleRealign() {
    try {
      setRealigning(true);
      amplitude.getInstance().logEvent("RESYNC");
      await karaoke.realign(id, title, captionsMode, handleStatusChanged);
      window.location.reload(true);
    } catch (e) {
      console.log(e);
      setError(e.toString());
    } finally {
      setRealigning(false);
    }
  }

  useEffect(() => {
    (async function () {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setError(null);
        setProgress(true);
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

        const currVideo = defaultVideo;
        handleStatusChanged("Searching lyrics");
        const lyr = await library.getLyrics(id, title);

        let currCaptions;
        if (params.captionsMode) {
          currCaptions = params.captionsMode;
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
        setProgress(false);
        setLyrics(lyr);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.log(error);
        setError(error.toString());
        setProgress(false);
        rollbar.error(error);
      }
    })();
  }, [id, title, defaultVideo, params.captionsMode]);

  if (!id) return null;

  return (
    <Shell youtubeID={id} defaultPlaylist={PLAYLIST_MIX}>
      <div className="flex flex-col items-center">
        {error ? (
          <Message negative onDismiss={handleCloseError}>
            <Message.Header>Ooops, some error occurred :(</Message.Header>
            <div className="py-1">{error}</div>
            <div className="py-1 cursor-pointer" onClick={handleRetry}>
              Click here to retry...
            </div>
          </Message>
        ) : null}
        {progress ? (
          <div className="w-2/4">
            <Message icon>
              <Icon name="circle notched" loading />
              <Message.Content>
                <Message.Header>{title}</Message.Header>
                <div className="py-2">{status}</div>
              </Message.Content>
            </Message>
          </div>
        ) : null}
        {videoURL && !error && !progress ? (
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
                  onChange={handleChangeVideo}
                />
                <Dropdown
                  button
                  text={" Captions: " + capitalize(captionsMode)}
                  value={captionsMode}
                  options={ccoptions}
                  onChange={handleChangeCaptions}
                />
                <Button
                  content={
                    editLyricsOpen ? "Close Lyrics Editor" : "Lyrics Editor"
                  }
                  onClick={handleEditLyrics}
                />
                {editLyricsOpen || realigning ? (
                  <Button
                    content="Resync Lyrics"
                    disabled={realigning}
                    loading={realigning}
                    onClick={handleRealign}
                  />
                ) : null}
                {[
                  library.MODE_CAPTIONS_LINE,
                  library.MODE_CAPTIONS_WORD,
                ].includes(captionsMode) ? (
                  <Button
                    content="Sync Editor"
                    onClick={handleOpenSyncEditor}
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
        {videoURL && editLyricsOpen ? (
          <div className="w-2/4 text-xl">
            <Message>
              NOTE: To maximize lyrics sync accuracy, keep an empty line between
              verses
            </Message>
            <Form>
              <TextArea
                className="text-xl"
                value={
                  lyrics ||
                  Array(10)
                    .map(() => "\n")
                    .join("")
                }
                rows={lyrics ? lyrics.split("\n").length : 10}
                onChange={handleLyricsChange}
              />
            </Form>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
