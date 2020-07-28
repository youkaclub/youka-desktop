import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Icon, Message, Button } from "semantic-ui-react";
import Sync from "../comps/SyncAdvanced";
import * as library from "../lib/library";
import * as karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";
import { Alignment } from "../lib/alignment";
import { Environment } from "../comps/Environment";

const querystring = require("querystring");
const amplitude = require("amplitude-js");

export default function SyncAdvancedPage() {
  let history = useHistory();
  const location = useLocation();
  const { id, videoMode, captionsMode } = querystring.parse(
    location.search.slice(1)
  );
  const [audioUrl, setAudioUrl] = useState<string>();
  const [syncing, setSyncing] = useState<boolean>();
  const [alignments, setAlignments] = useState<Alignment[]>();
  const [status, setStatus] = useState<string>();
  const [synced, setSynced] = useState<boolean>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function init() {
      const tmpAudioUrl = library.fileurl(id, videoMode, library.FileType.M4A);
      setAudioUrl(tmpAudioUrl);
      const tmpAlignments = await library.getAlignments(id, captionsMode);
      setAlignments(tmpAlignments);
    }
    init();
  }, [id, videoMode, captionsMode]);

  async function handleClose() {
    if (alignments) {
      await library.setAlignments(id, captionsMode, alignments);
    }
    history.push("/");
  }

  async function handleSync() {
    try {
      setError(undefined);
      setSyncing(true);
      setSynced(false);
      amplitude.getInstance().logEvent("RESYNC", {
        mode: library.CaptionsMode.Word,
        comp: "sync-editor-advanced",
      });
      if (alignments) {
        await library.setAlignments(id, captionsMode, alignments);
      }
      await karaoke.alignline(id, (s: string) => setStatus(s));
      setSynced(true);
    } catch (e) {
      setError(e.toString());
      console.log(e);
      rollbar.error(e);
    } finally {
      setStatus(undefined);
      setSyncing(false);
    }
  }

  function handleChange(als: Alignment[]) {
    setAlignments(als);
  }

  return (
    <Environment>
      <div className="flex flex-col p-4">
        <div className="flex flex-row justify-center pb-4">
          {captionsMode === library.CaptionsMode.Line ? (
            <Button
              content="Sync Words"
              onClick={handleSync}
              disabled={syncing}
            />
          ) : null}
          <Button content="Close" onClick={handleClose} />
        </div>
        <div className="flex flex-row justify-center">
          <div className="w-2/4">
            {synced ? (
              <Message color="green" icon>
                <Icon name="check circle" />
                <Message.Header>Sync is completed successfully</Message.Header>
              </Message>
            ) : null}
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
              <Message icon negative>
                <Icon name="exclamation circle" />
                <Message.Content>
                  <Message.Header>Sync processing is failed</Message.Header>
                  <div className="py-1">{error}</div>
                </Message.Content>
              </Message>
            ) : null}
          </div>
        </div>
        <div className="flex flex-row p-4 justify-center">
          <Message>
            <Message.Header>Instructions</Message.Header>
            <Message.List>
              <Message.Item>
                Click on the play button, wait for the start of the{" "}
                {captionsMode}, then click immediately on the Set Start button,
                then wait for the end of the {captionsMode}, then click
                immediately on the Set End button
              </Message.Item>
              <Message.Item>
                Click on the plus and minus buttons to edit the {captionsMode}{" "}
                timing (minutes/seconds/milliseconds)
              </Message.Item>
              <Message.Item>
                Click on the backward button to set the start of the{" "}
                {captionsMode} as the end of the previous {captionsMode}
              </Message.Item>
              <Message.Item>
                Click on the forward button to set the end of the {captionsMode}{" "}
                as the start of the next {captionsMode}
              </Message.Item>
              <Message.Item>
                Click on the Sync Words button to re-sync words automatically
                using the manually fixed lines
              </Message.Item>
            </Message.List>
          </Message>
        </div>
        <Sync
          audioUrl={audioUrl}
          alignments={alignments}
          onChange={handleChange}
        />
      </div>
    </Environment>
  );
}
