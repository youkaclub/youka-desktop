const assert = require("assert");
const youtube = require("../../../src/lib/youtube");

describe("trending", () => {
  it("should return playlist", async () => {
    const items = await youtube.trending();
    const actual = items.length;
    const expected = 30;
    assert.equal(actual, expected);
  });
});
