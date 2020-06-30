const assert = require("assert");
const crypto = require("crypto");
const search = require("../../../src/lib/lyrics");

describe("search", () => {
  it("should return lyrics", async () => {
    const query = "ellie goulding your song";
    const lyrics = await search(query);
    const actual = crypto.createHash("md5").update(lyrics).digest("hex");
    const expected = "074b35d53caa26e545253865aefb6363";
    assert.equal(actual, expected);
  });

  it("should return nothing", async () => {
    const query = "abcdefgasdalkjfalddsk";
    const actual = await search(query);
    const expected = undefined;
    assert.equal(actual, expected);
  });
});
