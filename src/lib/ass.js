class Ass {
  constructor(options) {
    options = options || {};
    this.scriptInfo = options.scriptInfo || new ScriptInfo();
    this.styles = options.styles || new Styles();
    this.events = options.events || new Events();
  }

  toString() {
    return [this.scriptInfo, this.styles, this.events].join("\n\n");
  }
}

class ScriptInfo {
  constructor(options) {
    options = options || {};
    this.header = "[Script Info]";
    this.wrapStyle = options.wrapStyle || 0;
    this.playResX = options.playResX || 480;
    this.playResY = options.playResY || 360;
  }

  toString() {
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

class Styles {
  constructor(styles) {
    this.header =
      "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding";
    this.styles = styles || [new Style()];
  }

  add(style) {
    this.styles.push(style);
  }

  toString() {
    return this.header + "\n" + this.styles.join("\n");
  }
}

class Style {
  constructor(options) {
    options = options || {};
    this.styleName = options.styleName || "Youka";
    this.fontName = options.fontName || "Arial";
    this.fontSize = options.fontSize || 34;
  }
  toString() {
    return `Style: ${this.styleName},${this.fontName},${this.fontSize},&H00D08521,&H00FFFFFF,&H00000000,&H00FFFFFF,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1`;
  }
}

class Events {
  constructor(events) {
    this.header =
      "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text";
    this.events = events || [];
  }

  add(event) {
    this.events.push(event);
  }

  toString() {
    return this.header + "\n" + this.events.join("\n");
  }
}

class Dialogue {
  constructor(options) {
    options = options || {};
    this.start = this.parseTime(options.start);
    this.end = this.parseTime(options.end);
    this.text = options.text;
    this.style = options.style;
  }

  parseTime(obj) {
    if (typeof obj === "string") return obj;
    return this.parseSeconds(obj);
  }

  parseSeconds(seconds) {
    const date = new Date(seconds * 1000);
    const ms = (date.getMilliseconds() + "").slice(0, 2);
    return `${date.toISOString().substr(11, 8)}.${ms}`;
  }

  toString() {
    return `Dialogue: 0,${this.start},${this.end},${this.style},,0,0,0,,${this.text}`;
  }
}

module.exports = {
  Ass,
  ScriptInfo,
  Styles,
  Style,
  Events,
  Dialogue,
};
