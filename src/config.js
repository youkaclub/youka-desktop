let config;

switch (process.env.NODE_ENV) {
  case "production":
    config = {
      ua: "UA-156962391-3",
      rollbar: "8bc78e38489c483a84347df43e9d0683",
      amplitude: "dc03783141382fcd88477b678563e55b",
      api: "https://apiv2.audioai.online",
    };
    break;
  case "youka":
    config = {
      ua: null,
      rollbar: null,
      amplitude: null,
      api: "http://localhost:8000",
    };
    break;
  default:
    config = {
      ua: null,
      rollbar: null,
      amplitude: null,
      api: "https://apiv2.audioai.online",
    };
    break;
}

module.exports = config;
