function match(query, s) {
  query = query.toLowerCase();
  s = s.toLowerCase();

  const words = query.split(" ").map((word) => word.toLowerCase());
  const missed = words.filter((word) => !s.includes(word) && word.length > 2);

  const missPerc = (missed.length / words.length) * 100;
  const match = missPerc < 30;

  return match;
}

module.exports = {
  match,
};
