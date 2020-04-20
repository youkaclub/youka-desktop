const youtube = require("../../../lib/youtube");

describe("trending", () => {
  it("should return playlist", async () => {
    const items = await youtube.trending();
    expect(items.length).toEqual(30);
  });
});
