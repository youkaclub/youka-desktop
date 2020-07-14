import { Ass, Events, Dialogue } from "./ass";

interface Options {
  primaryColor: string // hex code for regular lyrics color
  secondaryColor: string // hex code for hilighted lyrics color
  waitLine: number  // time in seconds to remain on previous line before swapping to the next one (as long as it hasn't started yet)
  breakLength: number // threshold time in seconds to insert a break between lyrics with preroll
  style: string // ASS style to assign to lyrics
  delta: number // adjustment time in seconds to subtract from all timings
  fixDelta: number // minimum time in seconds to assign to a word with zero or negative duration
}

interface Alignment {
  start: number
  end: number
  paragraph: number
  line: number
  text: string
}

interface CodedAlignment {
  start: number
  end: number
  text: string
  code: string
  position?: "top" | "bottom"
}

const defaultOptions: Options = {
  primaryColor: "&HFFFFFF&",
  secondaryColor: "&HD08521&",
  waitLine: 1,
  breakLength: 5,
  style: "Youka",
  delta: 0.2,
  fixDelta: 0.1
};

export function alignmentsToAss(alignments: Alignment[], customOptions: Partial<Options> = {}): Ass | null {
  const options = { ...defaultOptions, customOptions };

  if (!alignments.length) return null;

  const fixedAlignments = fixAlignments(alignments, options);
  const codedLines = makeCodedLines(fixedAlignments);
  const interleavedLines = interleaveLines(codedLines, options);

  const dialogues = interleavedLines.map(a =>
    new Dialogue({
      start: a.start,
      end: a.end,
      text: a.code,
      style: options.style
    })
  );

  return new Ass({
    events: new Events(dialogues),
  });
}

function fixAlignments(alignments: Alignment[], { delta, fixDelta }: { delta: number, fixDelta: number }): Alignment[] {
  let offsetNextStart = 0;

  return alignments.map(alignment => {
    let { start, end } = alignment;

    // fix start === end or end < start
    start += offsetNextStart
    if (start === end) {
      end += fixDelta;
      offsetNextStart = fixDelta;
    } else if (end < start) {
      start = end;
      end += fixDelta;
      offsetNextStart = fixDelta;
    } else {
      offsetNextStart = 0;
    }

    // add delta
    if (start >= delta) {
      start -= delta;
      end -= delta;
    }

    return { ...alignment, start, end };
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
  return lines;
}

function makeCodedLines(alignments: Alignment[]): CodedAlignment[] {
  const lines = alignmentsByLine(alignments);

  return Object.values(lines).map(line => {
    const words = line.map(word => ({
      text: word.text,
      code: `${makeKTag(word.end - word.start)}${word.text}`,
      start: word.start,
      end: word.end,
    }));

    return words.reduce((a, b) => {
      const gap = b.start - a.end;
      return {
        start: a.start,
        end: b.end,
        text: [a.text, b.text].join(" "),
        code: gap > 0 ? `${a.code}${makeKTag(gap)} ${b.code}` : `${a.code} ${b.code}`
      }
    });
  });
}

function interleaveLines(lines: CodedAlignment[], { primaryColor, secondaryColor, waitLine, breakLength }: { primaryColor: string, secondaryColor: string, waitLine: number, breakLength: number }): CodedAlignment[] {
  const newLines: CodedAlignment[] = [];

  let previousLine: CodedAlignment | undefined = undefined;

  // add next line
  lines.forEach((line, i) => {
    const nextLine = lines[i + 1];
    
    const previousGap = previousLine ? line.start - previousLine.end : line.start;
    const nextGap = nextLine ? nextLine.start - line.end : 0;
    const position = (previousGap > breakLength || previousLine?.position === 'top') ? 'bottom' : 'top';

    let { start, end, code } = line;

    // insert preroll
    if (previousGap >= breakLength && previousGap >= 3) {
      newLines.push({
        start: start - 3,
        end: start,
        code: `{\\c${secondaryColor}}{\\K100}3... {\\K100}2... {\\K100}1...\\N{\\c${primaryColor}}${line.text}`,
        text: '3.. 2... 1..'
      });
    }

    if (nextLine !== undefined && nextGap < breakLength) {
      if (position === 'bottom') {
        code = `{\\c${primaryColor}}${nextLine.text}\\N{\\c${secondaryColor}}${line.code}`;
      } else {
        code = `{\\c${secondaryColor}}${line.code}\\N{\\K\\c${primaryColor}}${nextLine.text}`;
      }
    } else if (previousLine !== undefined) {
      // last line
      if (position === 'bottom') {
        code = `{\\2c${secondaryColor}}${previousLine.text}\\N{\\c${secondaryColor}\\2c${primaryColor}}${line.code}`;
      } else {
        code = `{\\c${secondaryColor}}${line.code}\\N{\\K\\2c${secondaryColor}}${previousLine.text}`;
      }
    }

    // add trailing gap, with max length of waitLine
    if (nextGap > 0) {
      const waitLength = Math.min(nextGap, waitLine);
      end = end + waitLength;
    }

    // add leading gap
    if (previousLine && previousGap > 0 && previousGap < breakLength) {
      start = previousLine.end;
      code = `${makeKTag(previousGap)}${code}`;
    }

    const newLine: CodedAlignment = { ...line, start, end, code, position };
    newLines.push(newLine);
    previousLine = newLine;
  });

  return newLines;
}

function makeKTag(durationSeconds: number): string {
  return `{\\K${Math.round(durationSeconds * 10000) / 100}}`;
}
