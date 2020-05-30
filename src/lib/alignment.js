class Alignment {
  constructor({ line, start, end, text }) {
    this.line = line;
    this.start = start;
    this.end = end;
    this.text = text;
  }
}

function Alignments(s) {
  const obj = JSON.parse(s);
  if (!obj) return;
  return obj.map((o) => new Alignment(o));
}

module.exports = {
  Alignment,
  Alignments,
};
