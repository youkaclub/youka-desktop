const assert = require("assert");
const google_site = require("../../../src/lib/lyrics/providers/google_site");

describe("google search query", () => {
  it("should return query", () => {
    const query = "query";
    const sites = ["abc.com", "def.com"];
    const actual = google_site.google_search_query(query, sites);
    const expected = "site:abc.com OR site:def.com query";
    assert.equal(actual, expected);
  });
});
