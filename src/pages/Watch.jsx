import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Message, Icon, Dropdown, Button } from "semantic-ui-react";
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

export default function WatchPage() {
  const location = useLocation();
  usePageView(location.pathname);
  const { id, title } = querystring.parse(location.search.slice(1));

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
  const [status, setStatus] = useState();
  const [lyrics, setLyrics] = useState();
  const [ddoptions, setddoptions] = useState([]);
  const [ccoptions, setccoptions] = useState([]);

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

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
    try {
      setDownloading(true);
      amplitude
        .getInstance()
        .logEvent("DOWNLOAD", { video: videoMode, captions: captionsMode });
      const file = data.value;
      const fpath = await library.download(id, videoMode, captionsMode, file);
      shell.showItemInFolder(fpath);
    } catch (e) {
      setError(e.toString());
      rollbar.error(e);
    } finally {
      setDownloading(false);
    }
  }

  function handleStatusChanged(s) {
    setStatus(s);
    debug(s);
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
        const lang = await library.getLanguage(id);
        handleStatusChanged("Searching lyrics");
        const lyr = await library.getLyrics(id, title);

        let currCaptions;
        if (library.MODE_CAPTIONS_WORD in files.captions && lang === "en") {
          currCaptions = library.MODE_CAPTIONS_WORD;
        } else if (library.MODE_CAPTIONS_LINE in files.captions) {
          currCaptions = library.MODE_CAPTIONS_LINE;
        } else if (library.MODE_CAPTIONS_WORD in files.captions) {
          currCaptions = library.MODE_CAPTIONS_WORD;
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
        setError(error.toString());
        setProgress(false);
        rollbar.error(error);
      }
    })();
  }, [id, title, defaultVideo]);

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
          <div>
            <div>
              <Player
                youtubeID={id}
                videoURL={videoURL}
                captionsURL={captionsURL}
              />
            </div>
            <div className="flex flex-row justify-between p-1">
              <div className="text-2xl leading-tight m-1">{title}</div>
            </div>
            <div className="flex flex-row w-full m-2 justify-center">
              <div className="flex flex-row p-2 mx-4">
                <Button
                  icon="close"
                  content="Close"
                  onClick={handleClickClose}
                />
                <Dropdown
                  button
                  loading={downloading}
                  text="Download"
                  value={null}
                  selectOnBlur={false}
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
      </div>
    </Shell>
  );
}
