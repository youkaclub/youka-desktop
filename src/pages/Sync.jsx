import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Message, Button } from "semantic-ui-react";
import Sync from "../comps/Sync";
import * as library from "../lib/library";
import karaoke from "../lib/karaoke";
import rollbar from "../lib/rollbar";
const querystring = require("querystring");

export default function SyncPage() {
  let history = useHistory();
  const location = useLocation();
  const { id, title, videoMode, captionsMode } = querystring.parse(
    location.search.slice(1)
  );
  const [audioUrl, setAudioUrl] = useState();
  const [saving, setSaving] = useState();
  const [syncing, setSyncing] = useState();
  const [alignments, setAlignments] = useState();

  useEffect(() => {
    async function init() {
      const tmpAudioUrl = library.fileurl(id, videoMode, library.FILE_M4A);
      setAudioUrl(tmpAudioUrl);
      const tmpAlignments = await library.getAlignments(id, captionsMode);
      setAlignments(tmpAlignments);
    }
    init();
  }, [id, videoMode, captionsMode]);

  function handleClose() {
    history.push(`/watch?id=${id}&title=${title}&captionsMode=${captionsMode}`);
  }

  async function handleSave() {
    setSaving(true);
    await library.setAlignments(id, captionsMode, alignments);
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await library.setAlignments(id, captionsMode, alignments);
      await karaoke.alignline(id, (status) => console.log(status));
    } catch (e) {
      console.log(e);
      rollbar.error(e);
    } finally {
      setSyncing(false);
    }
  }

  function handleChange(als) {
    setAlignments(als);
  }

  return (
    <div>
      <div className="flex flex-row p-4 justify-center">
        <Button
          content={saving ? "Saving" : "Save"}
          onClick={handleSave}
          loading={saving}
          disabled={saving}
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
