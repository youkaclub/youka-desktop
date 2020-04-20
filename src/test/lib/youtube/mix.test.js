const youtube = require("../../../lib/youtube");

describe("mix", () => {
  it("should return playlist", async () => {
    const items = await youtube.mix("D9AFMVMl9qE");
    expect(items.length).toEqual(25);
  });
});
