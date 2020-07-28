import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Button, Message, Icon } from "semantic-ui-react";
import SyncSimple from "../comps/SyncSimple";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";
import { Alignment } from "../lib/alignment";
import { Environment } from "../comps/Environment";

const querystring = require("querystring");
const amplitude = require("amplitude-js");

export default function SyncSimplePage() {
  let history = useHistory();
  const location = useLocation();
  const { id, title } = querystring.parse(location.search.slice(1));

  const [audioUrl, setAudioUrl] = useState<string>();
  const [lyrics, setLyrics] = useState<string>();
  const [lang, setLang] = useState<string>();
  const [syncing, setSyncing] = useState<boolean>();
  const [synced, setSynced] = useState<boolean>();
  const [finished, setFinished] = useState<boolean>();
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [captionsMode, setCaptionsMode] = useState<library.CaptionsMode>(
    library.CaptionsMode.Line
  );

  useEffect(() => {
    async function init() {
      const tmpAudioUrl = library.fileurl(
        id,
        library.MediaMode.Original,
        library.FileType.M4A
      );
      setAudioUrl(tmpAudioUrl);
      const tmpLyrics = await library.getLyrics(id);
      setLyrics(tmpLyrics);
      if (tmpLyrics) {
        const tmpLang = await library.getLanguage(id, tmpLyrics);
        setLang(tmpLang);
      }
    }
    init();
  }, [id]);

  async function handleClose() {
    history.push("/");
  }

  async function handleAlignments(alignments: Alignment[]) {
    amplitude.getInstance().logEvent("SIMPLE_SYNC_FINISHED");
    await library.setAlignments(id, library.CaptionsMode.Line, alignments);
    setFinished(true);
  }

  async function handleSync() {
    try {
      setStatus(undefined);
      setError(undefined);
      setSyncing(true);
      setSynced(false);
      amplitude.getInstance().logEvent("RESYNC", {
        mode: library.CaptionsMode.Word,
        comp: "sync-editor-simple",
      });
      await karaoke.alignline(id, (s: string) => setStatus(s));
      setCaptionsMode(library.CaptionsMode.Word);
      setStatus("Sync is completed successfully");
      setSynced(true);
    } catch (e) {
      setStatus(undefined);
      setError(e.toString());
      console.log(e);
      rollbar.error(e);
    } finally {
      setSyncing(false);
      setStatus(undefined);
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
    <Environment>
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
              <Icon name="check circle" />
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
            audioUrl={audioUrl}
            lyrics={lyrics}
            onAlignments={handleAlignments}
          />
        ) : null}
      </div>
    </Environment>
  );
}
