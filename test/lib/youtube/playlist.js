const assert = require("assert");
const youtube = require("../../../src/lib/youtube");

describe("playlist", () => {
  it("should return playlist", async () => {
    const items = await youtube.playlist("PL15B1E77BB5708555");
    const actual = items.length;
    const expected = 100;
    assert.equal(actual, expected);
  });
});
