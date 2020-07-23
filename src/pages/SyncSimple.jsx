import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Button, Message, Icon } from "semantic-ui-react";
import SyncSimple from "../comps/SyncSimple";
import * as library from "../lib/library";
import karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";

const querystring = require("querystring");
const amplitude = require("amplitude-js");

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
    amplitude.getInstance().logEvent("SIMPLE_SYNC_FINISHED");
    await library.setAlignments(id, library.MODE_CAPTIONS_LINE, alignments);
    setFinished(true);
  }

  async function handleSync() {
    try {
      setStatus(null);
      setError(null);
      setSyncing(true);
      setSynced(false);
      amplitude.getInstance().logEvent("RESYNC", {
        mode: library.MODE_CAPTIONS_WORD,
        comp: "sync-editor-simple",
      });
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
      setStatus(null);
    }
  }

  function renderInstructions() {
    return (
      <div className="flex flex-row p-4 justify-center">
        <Message>
          <Message.Header>Instructions</Message.Header>
          <Message.Content>
            <div className="py-2"></div>
            <div className="py-2">
              1. Click on the Play button to play the song and start the sync
              process
            </div>
            <div className="py-2">
              2. Click on the Set Start button when you hear the first word of
              current line
            </div>
            <div className="py-2">
              3. Click on the Set End button after you hear the last word of
              current line
            </div>
            <div className="py-2">
              4. Continue until you finish to sync all the lines
            </div>
            <div className="py-2">
              When you finish, you may click on the Sync Words button to improve
              the word level sync
            </div>
          </Message.Content>
        </Message>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 items-center">
      <div className="flex flex-col items-center w-2/4">
        <div>
          <Button
            content="Sync Words"
            onClick={handleSync}
            disabled={syncing || !finished}
          />
          <Button content="Close" onClick={handleClose} />
        </div>
        {synced ? (
          <Message color="green" icon>
            <Icon name="circle check" />
            <Message.Header>Sync is completed successfully</Message.Header>
          </Message>
        ) : null}
        {status ? (
          <Message icon>
            <Icon name="circle notched" loading />
            <Message.Content>
              <Message.Header>Sync Status</Message.Header>
              <div className="py-2">{status}</div>
            </Message.Content>
          </Message>
        ) : null}
        {error ? (
          <Message icon negative>
            <Icon name="exclamation circle" />
            <Message.Content>
              <Message.Header>Sync processing is failed</Message.Header>
              <div className="py-1">{error}</div>
            </Message.Content>
          </Message>
        ) : null}
        {finished ? null : renderInstructions()}
      </div>
      {finished && !syncing && !synced ? (
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
        />
      ) : null}
    </div>
  );
}
