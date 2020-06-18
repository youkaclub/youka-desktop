import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Message, Button } from "semantic-ui-react";
import Sync from "../comps/Sync";
import * as library from "../lib/library";
const querystring = require("querystring");

export default function SyncPage() {
  let history = useHistory();
  const location = useLocation();
  const { id, title, videoMode, captionsMode } = querystring.parse(
    location.search.slice(1)
  );
  const [audioUrl, setAudioUrl] = useState();
  const [saving, setSaving] = useState();
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

  function handleChange(als) {
    setAlignments(als);
  }

  return (
    <div>
      <div className="flex flex-row p-4 justify-center">
        <Button
          content={saving ? "Saving" : "Save"}
          onClick={handleSave}
          disabled={saving}
        />
        <Button content="Close" onClick={handleClose} />
      </div>
      <div className="flex flex-row p-4 justify-center">
        <Message>
          Use the plus and minus buttons to edit the {captionsMode} timing, the{" "}
          {captionsMode} will be played after every change
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
