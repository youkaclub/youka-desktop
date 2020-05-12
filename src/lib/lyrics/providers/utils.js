const compareTwoStrings = require("string-similarity").compareTwoStrings;

function match(a, b) {
  const score = compareTwoStrings(a, b);
  return score > 0.5;
}

module.exports = {
  match,
};
