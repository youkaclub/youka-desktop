import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Button, Message, Icon } from "semantic-ui-react";
import SyncSimple from "../comps/SyncSimple";
import * as library from "../lib/library";
import karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";

const querystring = require("querystring");

export default function SyncSimplePage() {
  let history = useHistory();
  const location = useLocation();
  const { id, title } = querystring.parse(location.search.slice(1));

  const [audioUrl, setAudioUrl] = useState();
  const [lyrics, setLyrics] = useState();
  const [lang, setLang] = useState();
  const [syncing, setSyncing] = useState();
  const [synced, setSynced] = useState();
  const [finished, setFinished] = useState();
  const [status, setStatus] = useState();
  const [error, setError] = useState();
  const [captionsMode, setCaptionsMode] = useState(library.MODE_CAPTIONS_LINE);

  useEffect(() => {
    async function init() {
      const tmpAudioUrl = library.fileurl(
        id,
        library.MODE_MEDIA_ORIGINAL,
        library.FILE_M4A
      );
      setAudioUrl(tmpAudioUrl);
      const tmpLyrics = await library.getLyrics(id);
      setLyrics(tmpLyrics);
      const tmpLang = await library.getLanguage(id, tmpLyrics);
      setLang(tmpLang);
    }
    init();
  }, [id]);

  async function handleClose() {
    history.push(`/watch?id=${id}&title=${title}&captionsMode=${captionsMode}`);
  }

  async function handleAlignments(alignments) {
    await library.setAlignments(id, library.MODE_CAPTIONS_LINE, alignments);
    setFinished(true);
  }

  async function handleLyrics(lyr) {
    setLyrics(lyr);
    return library.setLyrics(id, lyr);
  }

  async function handleSync() {
    try {
      setStatus(null);
      setError(null);
      setSyncing(true);
      await karaoke.alignline(id, (s) => setStatus(s));
      setCaptionsMode(library.MODE_CAPTIONS_WORD);
      setStatus("Sync is completed successfully");
      setSynced(true);
    } catch (e) {
      setStatus(null);
      setError(e.toString());
      console.log(e);
      rollbar.error(e);
    } finally {
      setSyncing(false);
    }
  }

  function handleCloseError() {
    setError(null);
  }

  function renderInstructions() {
    return (
      <div className="flex flex-row p-4 justify-center">
        <Message>
          <Message.Header>Instructions</Message.Header>
          <Message.List>
            <Message.Item>
              Click on the Start button to play the song and start the sync
              process
            </Message.Item>
            <Message.Item>
              Click on the Set Start button when you hear the first word of
              current line
            </Message.Item>
            <Message.Item>
              Click on the Set End button after you hear the last word of
              current line
            </Message.Item>
            <Message.Item>
              Continue until you finish to sync all the lines
            </Message.Item>
            <Message.Item>
              Now you can improve the word level sync automatically by click on
              the Sync Words button (it will be available after you finish)
            </Message.Item>
            <Message.Item>
              You may adjust the sync results using the Advanced Sync Editor
            </Message.Item>
            <Message.Item>
              Pro tip: Use the space key to set start or end
            </Message.Item>
          </Message.List>
        </Message>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 items-center">
      <div className="flex flex-col items-center w-2/4">
        <div>
          {finished &&
          !synced &&
          lang &&
          karaoke.SUPPORTED_LANGS.includes(lang) ? (
            <Button
              primary
              content={syncing ? "Syncing" : "Sync Words"}
              onClick={handleSync}
              loading={syncing}
              disabled={syncing}
            />
          ) : null}
          <Button content="Close" onClick={handleClose} />
        </div>

        {status ? (
          <Message icon>
            <Icon name="circle notched" loading={syncing} />
            <Message.Content>
              <Message.Header>Sync Status</Message.Header>
              <div className="py-2">{status}</div>
            </Message.Content>
          </Message>
        ) : null}
        {error ? (
          <Message negative onDismiss={handleCloseError}>
            <Message.Header>Ooops, some error occurred :(</Message.Header>
            <div className="py-1">{error}</div>
          </Message>
        ) : null}
        {finished ? null : renderInstructions()}
      </div>
      {finished && !synced ? (
        <div className="m-8 text-2xl">
          <div>Good job!</div>
          <br />
          {lang && karaoke.SUPPORTED_LANGS.includes(lang) ? (
            <div>
              Click on <b>Sync Words</b> to get even better word level sync
              automatically
            </div>
          ) : null}
          <br />
          <div>
            Click on <b>Close</b> to watch the results
          </div>
        </div>
      ) : null}
      {!finished ? (
        <SyncSimple
          id={id}
          audioUrl={audioUrl}
          lyrics={lyrics}
          onAlignments={handleAlignments}
          onLyrics={handleLyrics}
        />
      ) : null}
    </div>
  );
}
