const search = require("../../../lib/lyrics");


describe("search", () => {
  it("should return lyrics", async () => {
    const query = "ellie goulding your song",
    const lyr = await search(query);
    expect(lyr).toBeTruthy();
    expect(lyr.length).toBeGreaterThan(100);
  });

  it("should return nothing", async () => {
    const query = "abcdefgasdalkjfalddsk";
    const lyr = await search(query);
    expect(lyr).toBeFalsy();
  });
});
