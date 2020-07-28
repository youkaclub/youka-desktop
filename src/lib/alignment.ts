export interface Alignment {
  start: number;
  end: number;
  paragraph: number;
  line: number;
  word: number;
  text: string;
}

export function makeAlignment({
  start,
  end,
  paragraph,
  line,
  word,
  text,
}: any): Alignment {
  return { start, end, paragraph, line, word, text };
}

export function alignmentsFromJSON(s: string) {
  const obj = JSON.parse(s);
  if (!obj) return;
  return obj.map(makeAlignment);
}
