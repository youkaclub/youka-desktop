const youtube = require("../../../lib/youtube");
const fs = require("fs");
jest.mock("request-promise-native");

describe("utils", () => {
  it("parse initial data search results", async () => {
    const initialData = JSON.parse(
      await fs.promises.readFile(
        "src/test/lib/youtube/assets/initial-data.json"
      )
    );
    const results = youtube.utils.parseInitialDataSearchResults(initialData);
    expect(results.length).toEqual(18);
    expect(results[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        image: expect.any(String),
        minutes: expect.any(Number),
        seconds: expect.any(Number),
      })
    );
  });

  it("should return initial data", async () => {
    const url = "https://www.youtube.com/watch?v=D9AFMVMl9qE";
    const obj = await youtube.utils.initialData(url);
    expect(obj).toEqual(
      expect.objectContaining({
        contents: expect.any(Object),
      })
    );
  });

  const titles = [
    [
      "[Big Fish & Begonia (大鱼海棠) Theme Song] Zhou Shen (周深) - Big Fish (大鱼) [ENG SUB + PINYIN + CHINESE]",
      "Zhou Shen - Big Fish",
    ],
    ["艾怡良 Eve Ai《給朱利安》Official Music Video", "艾怡良 Eve Ai"],
    [
      "Ellie Goulding - Your Song (Official Music Video)",
      "Ellie Goulding - Your Song",
    ],
    [
      "【HD】Fate/stay night [Heaven's Feel] I.Presage Flower - Aimer - 花の唄【中日字幕】",
      "Fate/stay night I.Presage Flower - Aimer - 花の唄",
    ],
  ];
  it.each(titles)("should clean title %s", async (title, excepted) => {
    const actual = youtube.utils.cleanTitle(title);
    expect(actual).toEqual(excepted);
  });

  it("should clean results", async () => {
    const results = [
      { title: "eminem" },
      { title: "Ellie Goulding - Your Song (Official Music Video)" },
    ];
    const actual = youtube.utils.cleanResults(results);
    const excepted = [{ title: "Ellie Goulding - Your Song" }];
    expect(actual).toEqual(excepted);
  });
});
