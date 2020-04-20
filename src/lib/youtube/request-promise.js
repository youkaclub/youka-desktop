const rp = require("request-promise");
const UserAgent = require("user-agents");
const userAgent = new UserAgent({ deviceCategory: "desktop" });
const ua = userAgent.random().toString();

const request = rp.defaults({
  headers: {
    Referer: "https://www.youtube.com",
    "User-Agent": ua,
  },
});

module.exports = request;
