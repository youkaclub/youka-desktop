export interface Alignment {
  start: number;
  end: number;
  paragraph: number;
  line: number;
  text: string;
}

export function makeAlignment({
  start,
  end,
  paragraph,
  line,
  text,
}: any): Alignment {
  return { start, end, paragraph, line, text };
}

export function alignmentsFromJSON(s: string) {
  const obj = JSON.parse(s);
  if (!obj) return;
  return obj.map(makeAlignment);
}
