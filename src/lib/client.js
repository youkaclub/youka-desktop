const debug = require("debug")("youka:desktop");
const rp = require("request-promise");
const api = require("../config").api;
const retry = require("promise-retry");

class Client {
  async enqueue(queue, body) {
    const { id } = await retry((r) =>
      rp({
        uri: `${api}/queues/${queue}/enqueue`,
        method: "POST",
        json: true,
        body,
      }).catch(r)
    );
    return id;
  }

  async upload(body) {
    const { url } = await retry((r) =>
      rp({ uri: `${api}/upload`, json: true }).catch(r)
    );

    await retry((r) =>
      rp({
        uri: url,
        body,
        method: "PUT",
      }).catch(r)
    );

    return url;
  }

  async result(queue, id) {
    return retry((r) =>
      rp({ uri: `${api}/queues/${queue}/${id}/result`, json: true }).catch(r)
    );
  }

  async status(queue, id) {
    return retry((r) =>
      rp({ uri: `${api}/queues/${queue}/${id}/status`, json: true }).catch(r)
    );
  }

  async wait(queue, id) {
    while (true) {
      const { status } = await this.status(queue, id);
      debug(queue, status, id);
      switch (status) {
        case "succeeded":
          return true;
        case "failed":
        case "?":
          return false;
        default:
          await (async () =>
            new Promise((resolve) => setTimeout(resolve, 10000)))();
      }
    }
  }
}

module.exports = Client;
