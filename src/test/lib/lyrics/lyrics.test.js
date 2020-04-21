const search = require("../../../lib/lyrics");

const queries = [
  "如果有如果-鄧福如",
  "Zhou Shen - Big Fish",
  "ellie goulding your song",
  "임영웅 - 이제 나만 믿어요",
  "Xxl Irione - UNA CERVEZA",
  "Jassa Dhillon Surma",
  "あいみょん - マリーゴールド",
  "Coverheads - No te vayas mal",
  "คบไม่ได้ - เต้น นรารักษ์",
  "郁可唯 Yisa Yu",
];

describe("search", () => {
  it.each(queries)("%s", async (query) => {
    jest.setTimeout(100000);
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
