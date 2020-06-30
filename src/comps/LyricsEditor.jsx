import React, { useState, useEffect } from "react";
import { Button, Message, Icon, Form, TextArea } from "semantic-ui-react";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";
const amplitude = require("amplitude-js");

export default function LyricsEditor({ id, onSynced }) {
  const [status, setStatus] = useState();
  const [error, setError] = useState();
  const [syncing, setSyncing] = useState();
  const [synced, setSynced] = useState();
  const [mode, setMode] = useState();
  const [lyrics, setLyrics] = useState();

  useEffect(() => {
    async function init() {
      const lyrics = (await library.getLyrics(id)) || "";
      setLyrics(lyrics);
    }
    if (id) {
      init();
    }
  }, [id]);

  async function handleLyricsChange(e, data) {
    setLyrics(data.value);
    return library.setLyrics(id, data.value);
  }

  async function handleSync(selectedMode) {
    try {
      setMode(selectedMode);
      setStatus("Start syncing");
      setError(null);
      setSyncing(true);
      setSynced(false);
      amplitude
        .getInstance()
        .logEvent("RESYNC", { mode: selectedMode, comp: "lyrics-editor" });
      await karaoke.realign(id, null, selectedMode, (s) => setStatus(s));
      setSynced(true);
      onSynced(selectedMode);
    } catch (e) {
      console.log(e);
      setError(e.toString());
      rollbar.error(e);
    } finally {
      setSyncing(false);
      setStatus(null);
      setMode(null);
    }
  }

  return (
    <div className="w-2/4">
      <Message>
        NOTE: To maximize lyrics sync accuracy, keep an empty line between
        verses
      </Message>
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
        <Message negative={true} icon>
          <Icon name="error" />
          <Message.Content>
            <Message.Header>Sync Failed</Message.Header>
            <div className="py-2">{error}</div>
          </Message.Content>
        </Message>
      ) : null}
      <div className="flex flex-row pb-4 justify-center">
        <Button
          content="Sync Lines"
          disabled={
            syncing ||
            mode === library.MODE_CAPTIONS_WORD ||
            !lyrics ||
            lyrics.length < 100
          }
          onClick={() => handleSync(library.MODE_CAPTIONS_LINE)}
        />
        <Button
          content="Sync Words"
          disabled={syncing || !lyrics || lyrics.length < 100}
          onClick={() => handleSync(library.MODE_CAPTIONS_WORD)}
        />
      </div>
      <Form>
        <TextArea
          placeholder="Paste here the song lyrics"
          className="text-xl"
          value={lyrics}
          rows={
            lyrics && lyrics.split("\n").length > 10
              ? lyrics.split("\n").length
              : 10
          }
          onChange={handleLyricsChange}
        />
      </Form>
    </div>
  );
}
