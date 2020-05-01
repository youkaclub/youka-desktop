if (process.env.NODE_ENV === "production") {
  module.exports = {
    ua: "UA-156962391-3",
    rollbar: "8bc78e38489c483a84347df43e9d0683",
    fullstory: "TCK6J",
    api: "https://api.audioai.online",
  };
} else {
  module.exports = {
    ua: null,
    rollbar: null,
    fullstory: null,
    api: "http://localhost:8000",
  };
}
