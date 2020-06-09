const debug = require("debug")("youka:desktop");
const rp = require("request-promise");
const api = require("../config").api;

class Client {
  async enqueue(name, body) {
    const { id } = await rp({
      uri: `${api}/queues/${name}/enqueue`,
      method: "POST",
      body,
      json: true,
    });
    return id;
  }

  async upload(body) {
    const { url } = await rp({ uri: `${api}/upload`, json: true });
    await rp({
      uri: url,
      method: "PUT",
      body,
    });
    return url;
  }

  async result(name, id) {
    return rp(`${api}/queues/${name}/${id}/result`, {
      json: true,
    });
  }

  async status(name, id) {
    return rp(`${api}/queues/${name}/${id}/status`, {
      json: true,
    });
  }

  async wait(queue, jobId) {
    for (let index = 0; index < 1000; index++) {
      const { status } = await this.status(queue, jobId);
      debug(queue, status);
      switch (status) {
        case "succeeded":
          return;
        case "failed":
          throw new Error("process failed");
        case "?":
          throw new Error("unknown queue/job");
        default:
          await (async () =>
            new Promise((resolve) => setTimeout(resolve, 10000)))();
      }
    }
  }
}

module.exports = Client;
