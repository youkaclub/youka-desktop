import React, { useState, useEffect } from "react";
import { Message, Dimmer, Loader } from "semantic-ui-react";
import { useHistory, useLocation } from "react-router-dom";
import { downloadFfpmeg } from "../lib/mess";
import store from "../lib/store";
import rollbar from "../lib/rollbar";
import { usePageView } from "../lib/hooks";

export default function InitPage() {
  const location = useLocation();
  usePageView(location.pathname);

  let history = useHistory();
  const [error, setError] = useState();

  useEffect(() => {
    (async () => {
      try {
        await downloadFfpmeg();
        store.set("initialized", true);
        history.push("/");
      } catch (error) {
        setError(error.toString());
        rollbar.error(error);
      }
    })();
  }, [history]);

  return error ? (
    <Message negative>
      <Message.Header>Ooops, some error occurred :(</Message.Header>
      <p>{error}</p>
    </Message>
  ) : (
    <Dimmer inverted active>
      <Loader>Initializing. It may take a minute..</Loader>
    </Dimmer>
  );
}
