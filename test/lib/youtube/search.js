const assert = require("assert");
const youtube = require("../../../src/lib/youtube");

describe("search", () => {
  it("should return search", async () => {
    const items = await youtube.search("eminem");
    const actual = items.length;
    const expected = 17;
    assert.equal(actual, expected);
  });
});
