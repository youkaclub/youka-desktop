const assert = require("assert");
const youtube = require("../../../src/lib/youtube");

describe("mix", () => {
  it("should return playlist", async () => {
    const items = await youtube.mix("D9AFMVMl9qE");
    const actual = items.length;
    const expected = 25;
    assert.equal(actual, expected);
  });
});
