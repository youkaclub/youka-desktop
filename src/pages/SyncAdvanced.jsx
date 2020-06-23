import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Icon, Message, Button, Dropdown } from "semantic-ui-react";
import Sync from "../comps/SyncAdvanced";
import * as library from "../lib/library";
import karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";
const querystring = require("querystring");
const capitalize = require("capitalize");

export default function SyncAdvancedPage() {
  let history = useHistory();
  const location = useLocation();
  const { id, title, videoMode } = querystring.parse(location.search.slice(1));
  const [audioUrl, setAudioUrl] = useState();
  const [syncing, setSyncing] = useState();
  const [alignments, setAlignments] = useState();
  const [captionsMode, setCaptionsMode] = useState(library.MODE_CAPTIONS_LINE);
  const [status, setStatus] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    async function init() {
      const tmpAudioUrl = library.fileurl(id, videoMode, library.FILE_M4A);
      setAudioUrl(tmpAudioUrl);
      const tmpAlignments = await library.getAlignments(id, captionsMode);
      setAlignments(tmpAlignments);
    }
    init();
  }, [id, videoMode, captionsMode]);

  async function handleClose() {
    await library.setAlignments(id, captionsMode, alignments);
    history.push(`/watch?id=${id}&title=${title}&captionsMode=${captionsMode}`);
  }

  async function handleSync() {
    try {
      setError(null);
      setSyncing(true);
      await library.setAlignments(id, captionsMode, alignments);
      await karaoke.alignline(id, (s) => setStatus(s));
      setStatus("Sync is completed successfully");
    } catch (e) {
      setStatus(null);
      setError(e.toString());
      console.log(e);
      rollbar.error(e);
    } finally {
      setSyncing(false);
    }
  }

  function handleChange(als) {
    setAlignments(als);
  }

  function handleCloseError() {
    setError(null);
  }

  function handleChangeCaptions(e, data) {
    setCaptionsMode(data.value);
  }

  return (
    <div className="flex flex-col p-4">
      <div className="flex flex-row justify-center">
        <Dropdown
          button
          text={" Sync Mode: " + capitalize(captionsMode)}
          value={captionsMode}
          options={[
            {
              text: capitalize(library.MODE_CAPTIONS_LINE),
              value: library.MODE_CAPTIONS_LINE,
            },
            {
              text: capitalize(library.MODE_CAPTIONS_WORD),
              value: library.MODE_CAPTIONS_WORD,
            },
          ]}
          onChange={handleChangeCaptions}
        />
        {captionsMode === library.MODE_CAPTIONS_LINE ? (
          <Button
            content={syncing ? "Syncing" : "Sync Words"}
            onClick={handleSync}
            loading={syncing}
            disabled={syncing}
          />
        ) : null}
        <Button content="Close" onClick={handleClose} />
      </div>
      {status ? (
        <div className="flex flex-row w-2/4 p-4 self-center">
          <Message icon>
            <Icon name="circle notched" loading={syncing} />
            <Message.Content>
              <Message.Header>Sync Status</Message.Header>
              <div className="py-2">{status}</div>
            </Message.Content>
          </Message>
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-row justify-center p-4">
          <Message negative onDismiss={handleCloseError}>
            <Message.Header>Ooops, some error occurred :(</Message.Header>
            <div className="py-1">{error}</div>
          </Message>
        </div>
      ) : null}
      <div className="flex flex-row p-4 justify-center">
        <Message>
          <Message.Header>Instructions</Message.Header>
          <Message.List>
            <Message.Item>
              Click on the play button, wait for the start of the {captionsMode}
              , then click immediately on the Set Start button, then wait for
              the end of the {captionsMode}, then click immediately on the Set
              End button
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
  );
}
