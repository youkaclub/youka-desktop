import React, { useState } from "react";
import { Button } from "semantic-ui-react";

export default function ReportButton({ category, action, label, children }) {
  const [disabled, setDisabled] = useState(false);
  const [text, setText] = useState(children);

  function handleClick() {
    setDisabled(true);
    setText("Thanks!");
  }

  return (
    <Button
      icon="exclamation"
      content={text}
      disabled={disabled}
      onClick={handleClick}
    />
  );
}
