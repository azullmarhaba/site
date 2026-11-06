// ------------------------------------------------------------
// Minimal, dependency-free PDF writer (PDF 1.4).
// Base-14 Helvetica fonts + WinAnsiEncoding so Latin-1 text
// (English / French) renders correctly. Coordinates use the
// PDF convention: origin bottom-left, +y upward.
// ------------------------------------------------------------

export type Rgb = [number, number, number];
export type PdfFont = "regular" | "bold" | "oblique" | "boldOblique";
export type PdfJpegImage = { width: number; height: number; data: Buffer };

const FONT_REF: Record<PdfFont, string> = {
  regular: "F1",
  bold: "F2",
  oblique: "F3",
  boldOblique: "F4",
};

const FONT_BASE: Record<PdfFont, string> = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
  oblique: "Helvetica-Oblique",
  boldOblique: "Helvetica-BoldOblique",
};

// Glyph advance widths (per 1000 units) for ASCII 32..126.
const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const HELV_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

// WinAnsiEncoding mappings for common typographic characters.
const WINANSI_SPECIAL: Record<string, number> = {
  "€": 0x80,
  "‚": 0x82,
  "ƒ": 0x83,
  "„": 0x84,
  "…": 0x85,
  "†": 0x86,
  "‡": 0x87,
  "ˆ": 0x88,
  "‰": 0x89,
  "Š": 0x8a,
  "‹": 0x8b,
  "Œ": 0x8c,
  "Ž": 0x8e,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
  "˜": 0x98,
  "™": 0x99,
  "š": 0x9a,
  "›": 0x9b,
  "œ": 0x9c,
  "ž": 0x9e,
  "Ÿ": 0x9f,
};

/** Convert a JS string to an array of WinAnsi byte codes (0..255). */
function toWinAnsi(str: string): number[] {
  const out: number[] = [];
  for (const ch of str) {
    const code = ch.codePointAt(0) ?? 0x3f;
    if (code <= 0xff) out.push(code);
    else out.push(WINANSI_SPECIAL[ch] ?? 0x3f);
  }
  return out;
}

function charWidth(code: number, bold: boolean): number {
  if (code >= 32 && code <= 126) {
    return (bold ? HELV_BOLD : HELV)[code - 32];
  }
  if (code >= 160 && code <= 255) return bold ? 611 : 556;
  return 556;
}

function escapeCodes(codes: number[]): string {
  let s = "(";
  for (const c of codes) {
    if (c === 0x28) s += "\\(";
    else if (c === 0x29) s += "\\)";
    else if (c === 0x5c) s += "\\\\";
    else s += String.fromCharCode(c);
  }
  return s + ")";
}

export type TextOptions = {
  font?: PdfFont;
  size?: number;
  color?: Rgb;
};

export class PdfWriter {
  readonly width = 595.276; // A4
  readonly height = 841.89;

  private pages: string[] = [];
  private ops: string[] = [];
  private started = false;
  private image: PdfJpegImage | null = null;

  constructor() {
    this.addPage();
  }

  private fmt(n: number): string {
    return (Math.round(n * 100) / 100).toString();
  }

  private rgb(c: Rgb): string {
    return `${this.fmt(c[0] / 255)} ${this.fmt(c[1] / 255)} ${this.fmt(c[2] / 255)}`;
  }

  /** Start a new page; the previous page's operators are retained. */
  addPage(): void {
    if (this.started) this.pages.push(this.ops.join("\n"));
    this.ops = [];
    this.started = true;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  addImage(image: PdfJpegImage, x: number, y: number, width: number, height: number): void {
    this.image = image;
    this.ops.push(
      `q ${this.fmt(width)} 0 0 ${this.fmt(height)} ${this.fmt(x)} ${this.fmt(y)} cm /Im1 Do Q`
    );
  }

  /** Width of a single-line string in points. */
  measure(text: string, font: PdfFont = "regular", size = 11): number {
    const bold = font === "bold" || font === "boldOblique";
    let units = 0;
    for (const code of toWinAnsi(text)) units += charWidth(code, bold);
    return (units / 1000) * size;
  }

  /** Greedy word-wrap to a maximum width. */
  wrap(text: string, font: PdfFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (this.measure(candidate, font, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    mode: "fill" | "stroke" = "fill",
    color: Rgb = [0, 0, 0],
    lineWidth = 1
  ): void {
    this.ops.push(`${this.rgb(color)} ${lineWidth > 0 ? "RG" : ""}`.trim());
    if (mode === "fill") this.ops.push(`${this.rgb(color)} rg`);
    this.ops.push(`${this.fmt(x)} ${this.fmt(y)} ${this.fmt(w)} ${this.fmt(h)} re`);
    this.ops.push(mode === "fill" ? "f" : mode === "stroke" ? "S" : "B");
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: Rgb = [0, 0, 0],
    lineWidth = 1
  ): void {
    this.ops.push(`${this.rgb(color)} RG ${this.fmt(lineWidth)} w`);
    this.ops.push(`${this.fmt(x1)} ${this.fmt(y1)} m ${this.fmt(x2)} ${this.fmt(y2)} l S`);
  }

  /** Draw a single line of text at baseline (x, y). */
  text(str: string, x: number, y: number, opts: TextOptions = {}): void {
    const font = opts.font ?? "regular";
    const size = opts.size ?? 11;
    const color = opts.color ?? [26, 26, 26];
    const codes = escapeCodes(toWinAnsi(str));
    this.ops.push(
      `BT ${this.rgb(color)} rg /${FONT_REF[font]} ${this.fmt(size)} Tf ` +
        `${this.fmt(x)} ${this.fmt(y)} Td ${codes} Tj ET`
    );
  }

  /** Draw right-aligned text ending at xRight. */
  textRight(
    str: string,
    xRight: number,
    y: number,
    opts: TextOptions = {}
  ): void {
    const w = this.measure(str, opts.font ?? "regular", opts.size ?? 11);
    this.text(str, xRight - w, y, opts);
  }

  /** Draw centre-aligned text around xCenter. */
  textCenter(
    str: string,
    xCenter: number,
    y: number,
    opts: TextOptions = {}
  ): void {
    const w = this.measure(str, opts.font ?? "regular", opts.size ?? 11);
    this.text(str, xCenter - w / 2, y, opts);
  }

  finish(): Buffer {
    if (this.started) this.pages.push(this.ops.join("\n"));

    const pageCount = Math.max(1, this.pages.length);
    const contents = this.pages.length ? this.pages : [""];

    // Object numbering: catalog, pages, fonts, page content/page pairs, then the shared logo.
    const pageObjs = contents.map((content, i) => ({
      contentNum: 7 + i * 2,
      pageNum: 8 + i * 2,
      content,
    }));

    const objects = new Map<number, Buffer>();
    const setObject = (number: number, body: string | Buffer) => {
      const content = Buffer.isBuffer(body) ? body : Buffer.from(body, "latin1");
      objects.set(
        number,
        Buffer.concat([
          Buffer.from(`${number} 0 obj\n`, "latin1"),
          content,
          Buffer.from("\nendobj\n", "latin1"),
        ])
      );
    };

    setObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
    const kids = pageObjs.map((p) => `${p.pageNum} 0 R`).join(" ");
    setObject(2, `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>`);
    (["regular", "bold", "oblique", "boldOblique"] as PdfFont[]).forEach(
      (font, i) => {
        setObject(
          3 + i,
          `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_BASE[font]} /Encoding /WinAnsiEncoding >>`
        );
      }
    );
    for (const p of pageObjs) {
      setObject(
        p.contentNum,
        `<< /Length ${Buffer.byteLength(p.content, "latin1")} >>\nstream\n${p.content}\nendstream`
      );
      setObject(
        p.pageNum,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.fmt(this.width)} ${this.fmt(this.height)}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> ` +
          `${this.image ? `/XObject << /Im1 ${7 + pageObjs.length * 2} 0 R >> ` : ""}>> ` +
          `/Contents ${p.contentNum} 0 R >>`
      );
    }

    const imageNum = 7 + pageObjs.length * 2;
    if (this.image) {
      const header = Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${this.image.width} /Height ${this.image.height} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${this.image.data.length} >>\nstream\n`,
        "latin1"
      );
      setObject(imageNum, Buffer.concat([header, this.image.data, Buffer.from("\nendstream", "latin1")]));
    }

    const total = this.image ? imageNum : pageObjs[pageObjs.length - 1].pageNum;
    const parts: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
    let offset = parts[0].length;
    const offsets = new Array<number>(total + 1).fill(0);
    for (let num = 1; num <= total; num++) {
      const object = objects.get(num);
      if (!object) throw new Error(`PDF object ${num} is missing`);
      offsets[num] = offset;
      parts.push(object);
      offset += object.length;
    }
    const xrefOffset = offset;
    let xref = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
    for (let num = 1; num <= total; num++) {
      xref += `${String(offsets[num]).padStart(10, "0")} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    parts.push(Buffer.from(xref, "latin1"));
    return Buffer.concat(parts);
  }
}
