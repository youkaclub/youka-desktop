export class Ass {
  scriptInfo: ScriptInfo
  styles: Styles
  events: Events

  constructor(options: {
    scriptInfo?: ScriptInfo
    styles?: Styles
    events?: Events
  } = {}) {
    this.scriptInfo = options.scriptInfo || new ScriptInfo();
    this.styles = options.styles || new Styles();
    this.events = options.events || new Events();
  }

  toString(): string {
    return [this.scriptInfo, this.styles, this.events].join("\n\n");
  }
}

export class ScriptInfo {
  header: string
  wrapStyle: number
  playResX: number
  playResY: number

  constructor(options: {
    wrapStyle?: number
    playResX?: number
    playResY?: number
  } = {}) {
    this.header = "[Script Info]";
    this.wrapStyle = options.wrapStyle || 0;
    this.playResX = options.playResX || 640;
    this.playResY = options.playResY || 360;
  }

  toString(): string {
    return [
      this.header,
      "ScriptType: v4.00+",
      `WrapStyle: ${this.wrapStyle}`,
      "ScaledBorderAndShadow: yes",
      "YCbCr Matrix: TV.601",
      `PlayResX: ${this.playResX}`,
      `PlayResY: ${this.playResY}`,
    ].join("\n");
  }
}

export class Styles {
  header: string
  styles: Style[]

  constructor(styles?: Style[]) {
    this.header =
      "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding";
    this.styles = styles || [new Style()];
  }

  add(style: Style): void {
    this.styles.push(style);
  }

  toString(): string {
    return this.header + "\n" + this.styles.join("\n");
  }
}

export class Style {
  styleName: string
  fontName: string
  fontSize: number

  constructor(options: {
    styleName?: string
    fontName?: string
    fontSize?: number

  } = {}) {
    this.styleName = options.styleName || "Youka";
    this.fontName = options.fontName || "Arial";
    this.fontSize = options.fontSize || 30;
  }

  toString(): string {
    return `Style: ${this.styleName},${this.fontName},${this.fontSize},&H00D08521,&H00FFFFFF,&H00000000,&H00FFFFFF,0,0,0,0,100,100,0,0,1,1,0,2,10,10,35,1`;
  }
}

export class Events {
  header: string
  events: Dialogue[]

  constructor(events: Dialogue[] = []) {
    this.header =
      "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text";
    this.events = events;
  }

  add(event: Dialogue): void {
    this.events.push(event);
  }

  toString(): string {
    return this.header + "\n" + this.events.join("\n");
  }
}

export class Dialogue {
  start: string
  end: string
  text: string
  style: string

  constructor(options: {
    start: string | number
    end: string | number
    text: string
    style: string
  }) {
    this.start = this.parseTime(options.start);
    this.end = this.parseTime(options.end);
    this.text = options.text;
    this.style = options.style;
  }

  parseTime(obj: string | number): string {
    if (typeof obj === "string") return obj;
    return this.parseSeconds(obj);
  }

  parseSeconds(seconds: number): string {
    const date = new Date(seconds * 1000);
    const ms = (date.getMilliseconds() + "").slice(0, 2);
    return `${date.toISOString().substr(11, 8)}.${ms}`;
  }

  toString(): string {
    return `Dialogue: 0,${this.start},${this.end},${this.style},,0,0,0,,${this.text}`;
  }
}
