import React from "react";
import { Dimmer, Loader } from "semantic-ui-react";
import { Environment } from "./Environment";

export default function Fallback() {
  return (
    <Environment>
      <Dimmer inverted active>
        <Loader>Loading...</Loader>
      </Dimmer>
    </Environment>
  );
}
