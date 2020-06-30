const assert = require("assert");
const youtube = require("../../../src/lib/youtube");

describe("info", () => {
  it("should return info", async () => {
    const info = await youtube.info("D9AFMVMl9qE");
    const actual = info.title;
    const expected = "Ellie Goulding - Your Song (Official Music Video)";
    assert.equal(actual, expected);
  });
});
