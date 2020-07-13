import { Ass, Events, Dialogue } from "./ass";

interface Options {
  primaryColor: string
  secondaryColor: string
  waitLine: number
  style: string
  delta: number
  fixDelta: number
}

interface Alignment {
  start: number
  end: number
  paragraph: number
  line: number
  otext: string
  text: string
}

export function alignmentsToAss(alignments: Alignment[], options: Options) {
  options = options || {};
  const primaryColor = options.primaryColor || "&HFFFFFF&";
  const secondaryColor = options.secondaryColor || "&HD08521&";
  const waitLine = options.waitLine || 1;
  const style = options.style || "Youka";
  const delta = options.delta || 0.2;
  const fixDelta = options.fixDelta || 0.1;

  if (!alignments.length) return null;

  // fix start === end or end < start
  for (let i = 0; i < alignments.length; i++) {
    if (alignments[i].start === alignments[i].end) {
      alignments[i].end += fixDelta;
    } else if (alignments[i].end < alignments[i].start) {
      alignments[i].start = alignments[i].end;
      alignments[i].end += fixDelta;
    } else {
      continue;
    }
    if (i + 1 < alignments.length - 1) {
      alignments[i + 1].start += fixDelta;
    }
  }

  // add delta
  for (let i = 0; i < alignments.length; i++) {
    if (alignments[i].start < delta) continue;
    alignments[i].start -= delta;
    alignments[i].end -= delta;
  }

  const lines = alignmentsByLine(alignments);

  const newAlignments: Alignment[] = [];
  for (const [, lineAlignments] of Object.entries(lines)) {
    const newAlignment = lineAlignments[0];
    const k = (newAlignment.end - newAlignment.start) * 100;
    newAlignment.otext = newAlignment.text;
    newAlignment.text = `{\\K${k}}` + newAlignment.text;
    newAlignment.end = lineAlignments[lineAlignments.length - 1].end;

    for (let i = 1; i < lineAlignments.length; i++) {
      newAlignment.otext += " " + lineAlignments[i].text;
      if (i + 1 < lineAlignments.length) {
        const k = (lineAlignments[i + 1].start - lineAlignments[i].end) * 100;
        if (k > 0) {
          newAlignment.text += `{\\K${k}}`;
        }
      }
      const k = (lineAlignments[i].end - lineAlignments[i].start) * 100;
      newAlignment.text += ` {\\K${k}}${lineAlignments[i].text}`;
    }
    newAlignments.push(newAlignment);
  }

  // add next line
  for (let i = 0; i < newAlignments.length; i++) {
    let nextAlignment;
    if (i + 1 < newAlignments.length) {
      nextAlignment = newAlignments[i + 1];
    }

    const mod = (i + 1) % 2;
    if (nextAlignment) {
      if (mod > 0) {
        newAlignments[
          i
        ].text = `{\\c${secondaryColor}}${newAlignments[i].text}\\N{\\K\\c${primaryColor}}${nextAlignment.otext}`;
      } else {
        newAlignments[
          i
        ].text = `{\\c${primaryColor}}${nextAlignment.otext}\\N{\\c${secondaryColor}}${newAlignments[i].text}`;
      }
    } else if (i === newAlignments.length - 1) {
      // last line
      if (mod > 0) {
        newAlignments[i].text = `{\\c${secondaryColor}}${
          newAlignments[i].text
        }\\N{\\K\\2c${secondaryColor}}${newAlignments[i - 1].otext}`;
      } else {
        newAlignments[i].text = `{\\2c${secondaryColor}}${
          newAlignments[i - 1].otext
        }\\N{\\c${secondaryColor}\\2c${primaryColor}}${newAlignments[i].text}`;
      }
    }
  }

  // lead in
  for (let i = 0; i < newAlignments.length; i++) {
    let prevAlignment;
    if (i - 1 >= 0) {
      prevAlignment = newAlignments[i - 1];
    }
    let nextAlignment;
    if (i + 1 < newAlignments.length) {
      nextAlignment = newAlignments[i + 1];
    }

    const alignment = newAlignments[i];
    let start = alignment.start;
    let end = alignment.end;
    let text = alignment.text;

    if (prevAlignment) {
      // line after line
      start = prevAlignment.end;
    } else if (alignment.start - waitLine > 0) {
      // add standard wait time
      start = alignment.start - waitLine;
    }
    if (alignment.start > start) {
      text = `{\\K${(alignment.start - start) * 100}}${text}`;
    }

    if (nextAlignment) {
      if (alignment.end + waitLine <= nextAlignment.start) {
        end = alignment.end + waitLine;
      } else {
        end = nextAlignment.start;
      }
    }

    newAlignments[i].start = start;
    newAlignments[i].end = end;
    newAlignments[i].text = text;
  }

  const dialogues = newAlignments.map(
    (a) =>
      new Dialogue({
        start: a.start,
        end: a.end,
        text: a.text,
        style,
      })
  );

  return new Ass({
    events: new Events(dialogues),
  });
}

function alignmentsByLine(alignments: Alignment[]): Record<number, Alignment[]>  {
  let lineIndex = 1;
  const lines: Record<number, Alignment[]> = {};
  alignments.forEach((alignment, i) => {
    let line;
    if (alignment.paragraph) {
      if (i > 0) {
        const prevAlignment = alignments[i - 1];
        if (
          alignment.line > prevAlignment.line ||
          alignment.paragraph > prevAlignment.paragraph
        ) {
          lineIndex++;
          line = lineIndex;
        } else {
          line = lineIndex;
        }
      } else {
        line = lineIndex;
      }
    } else {
      line = alignment.line;
    }

    if (!(line in lines)) {
      lines[line] = [alignment];
    } else {
      lines[line].push(alignment);
    }
  });
  return lines
}
