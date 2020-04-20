const youtube = require("../../../lib/youtube");

describe("info", () => {
  it("should return info", async () => {
    const info = await youtube.info("D9AFMVMl9qE");
    expect(info.title).toEqual(
      "Ellie Goulding - Your Song (Official Music Video)"
    );
  });
});
