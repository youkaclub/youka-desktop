const assert = require("assert");
const youtube = require("../../../src/lib/youtube");
const fs = require("fs");

describe("utils", () => {
  it("parse initial data search results", async () => {
    const initialData = JSON.parse(
      await fs.promises.readFile("test/lib/youtube/assets/initial-data.json")
    );
    const items = youtube.utils.parseInitialDataSearchResults(initialData);
    const actual = items.length;
    const expected = 18;
    assert.equal(actual, expected);
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
  for (let i = 0; i < titles.length; i++) {
    it("should clean title", () => {
      const [title, expected] = titles[i];
      const actual = youtube.utils.cleanTitle(title);
      assert.equal(actual, expected);
    });
  }

  it("should clean results", async () => {
    const results = [
      { title: "eminem" },
      { title: "Ellie Goulding - Your Song (Official Music Video)" },
    ];
    const actual = youtube.utils.cleanResults(results);
    const excepted = [{ title: "Ellie Goulding - Your Song" }];
    assert.deepEqual(actual, excepted);
  });
});
