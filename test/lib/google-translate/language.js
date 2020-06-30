const assert = require("assert");
const gt = require("../../../src/lib/google-translate");

describe("language", () => {
  it("should return the right language", async () => {
    const text = "hello world";
    const actual = await gt.language(text);
    const expected = "en";
    assert.equal(actual, expected);
  });
});
