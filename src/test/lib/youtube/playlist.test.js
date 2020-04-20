const youtube = require("../../../lib/youtube");

describe("playlist", () => {
  it("should return playlist", async () => {
    const items = await youtube.playlist("PL15B1E77BB5708555");
    expect(items.length).toEqual(100);
  });
});
