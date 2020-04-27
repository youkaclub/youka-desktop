const utils = require("../../../lib/lyrics/providers/utils");

const tests = [
  ["Marc Aryan - Toi Je Te Garde", "Marc Aryan - Toi Je Te Garde", true],
  ["Marc Aryan - Toi Je Te Garde", "Toi Je Te Garde Marc Aryan", true],
  ["It's Okay God Karan Aujla I Rupan Bal I Proof I Latest Punjabi Songs 2020", "It's Okay God Karan Aujla", true],
  ["Marc Aryan - Toi Je Te Garde", "Marc Aryan - another song", false],
];
describe("match", () => {
  it.each(tests)("%s", async (a, b, expected) => {
    const actual = utils.match(a, b);
    expect(actual).toBe(expected);
  });
});
