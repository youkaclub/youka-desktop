const youtube = require("../../../lib/youtube");

describe("search", () => {
  it("should return search", async () => {
    const items = await youtube.search("eminem");
    expect(items.length).toBe(20);
    expect(items).toContainEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        image: expect.any(String),
        minutes: expect.any(Number),
        seconds: expect.any(Number),
      })
    );
  });
});
