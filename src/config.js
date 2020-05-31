module.exports = {
  ua: process.env.YOUKA_UA,
  rollbar: process.env.YOUKA_ROLLBAR,
  api: process.env.YOUKA_API || "http://localhost:8000",
};
