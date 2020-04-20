const rp = require("request-promise");
const UserAgent = require("user-agents");
const userAgent = new UserAgent({ deviceCategory: "desktop" });

module.exports = rp.defaults({
  headers: { "User-Agent": userAgent.random().toString() },
});
