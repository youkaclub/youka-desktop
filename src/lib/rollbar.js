const Rollbar = require("rollbar");
const accessToken = require("../config").rollbar;

module.exports = new Rollbar({
  accessToken,
  enabled: process.env.NODE_ENV === "production",
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: process.env.NODE_ENV,
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: process.env.REACT_APP_GIT_SHA,
        guess_uncaught_frames: true,
      },
    },
  },
});
