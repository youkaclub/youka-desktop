import React, { useState, useEffect } from "react";
import { Button, Message, Icon, Form, TextArea } from "semantic-ui-react";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";
const amplitude = require("amplitude-js");

export default function LyricsEditor({
  id,
  onSynced,
}: {
  id: string;
  onSynced(mode: library.CaptionsMode): void;
}) {
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [syncing, setSyncing] = useState<boolean>();
  const [synced, setSynced] = useState<boolean>();
  const [lyrics, setLyrics] = useState<string>();

  useEffect(() => {
    async function init() {
      const lyrics = (await library.getLyrics(id)) || "";
      setLyrics(lyrics);
    }
    if (id) {
      init();
    }
  }, [id]);

  async function handleLyricsChange(_: unknown, data: any) {
    setLyrics(data.value);
    return library.setLyrics(id, data.value);
  }

  async function handleSync(selectedMode: library.CaptionsMode) {
    try {
      setStatus("Start syncing");
      setError(undefined);
      setSyncing(true);
      setSynced(false);
      amplitude
        .getInstance()
        .logEvent("RESYNC", { mode: selectedMode, comp: "lyrics-editor" });
      await karaoke.realign(id, undefined, selectedMode, (s: string) =>
        setStatus(s)
      );
      setSynced(true);
      onSynced(selectedMode);
    } catch (e) {
      console.log(e);
      setError(e.toString());
      rollbar.error(e);
    } finally {
      setSyncing(false);
      setStatus(undefined);
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
        <Message negative={true} icon>
          <Icon name="warning" />
          <Message.Content>
            <Message.Header>Sync Failed</Message.Header>
            <div className="py-2">{error}</div>
          </Message.Content>
        </Message>
      ) : null}
      <div className="flex flex-row pb-4 justify-center">
        <Button
          content="Sync Lyrics"
          disabled={syncing || !lyrics || lyrics.length < 100}
          onClick={() => handleSync(library.CaptionsMode.Word)}
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
