import React from "react";
import { Dimmer, Loader } from "semantic-ui-react";

export default function Fallback() {
  return (
    <Dimmer inverted active>
      <Loader>Loading</Loader>
    </Dimmer>
  );
}
