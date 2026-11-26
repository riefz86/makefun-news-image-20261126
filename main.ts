// World news poster for Thursday 26 November 2026 — make.fun news-image-20261126.
// A Node 22 program (stdlib only) that draws a 1024x1024 newspaper-style poster
// with the five biggest stories of the day and writes /output/entry.png.
// Deterministic: no network, no clock, no randomness — same input, same bytes.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

type RGB = [number, number, number];
const PAPER: RGB = [248, 243, 232];
const CREAM: RGB = [255, 252, 244];
const INK: RGB = [24, 24, 24];
const NAVY: RGB = [28, 52, 88];
const NAVY_DARK: RGB = [18, 36, 62];
const RED: RGB = [178, 44, 34];
const GOLD: RGB = [200, 150, 54];
const GREY: RGB = [98, 98, 92];
const SKY: RGB = [170, 206, 226];
const DUSK: RGB = [234, 180, 122];
const SAND: RGB = [233, 215, 177];
const SEA: RGB = [48, 112, 144];
const STEEL: RGB = [72, 84, 98];
const SMOKE: RGB = [122, 122, 120];
const ORANGE: RGB = [226, 124, 44];
const YELLOW: RGB = [242, 198, 68];
const DARK_SKY: RGB = [22, 30, 52];

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);
function paint(c: RGB): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function put(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function box(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, c);
}
function seg(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    put(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x += sx; }
    if (e2 <= dx) { e += dx; y += sy; }
  }
}
function dot(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) put(cx + x, cy + y, c);
    }
  }
}
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minX = Math.min(x0, x1, x2);
  const maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
  if (d === 0) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
      const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
      if (a >= 0 && b >= 0 && 1 - a - b >= 0) put(x, y, c);
    }
  }
}
function frame(x: number, y: number, w: number, h: number, c: RGB): void {
  box(x, y, w, 2, c);
  box(x, y + h - 2, w, 2, c);
  box(x, y, 2, h, c);
  box(x + w - 2, y, 2, h, c);
}

// ---------------------------------------------------------------- PNG out
const CRC: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePng(rgb: Uint8Array, w: number, h: number): Buffer {
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows; each row is a 5-bit mask, bit 4 = leftmost pixel.
const GLYPHS: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  a: [0, 0, 14, 1, 15, 17, 15],
  b: [16, 16, 22, 25, 17, 17, 30],
  c: [0, 0, 14, 16, 16, 17, 14],
  d: [1, 1, 13, 19, 17, 17, 15],
  e: [0, 0, 14, 17, 31, 16, 14],
  f: [6, 9, 8, 30, 8, 8, 8],
  g: [0, 15, 17, 17, 15, 1, 14],
  h: [16, 16, 22, 25, 17, 17, 17],
  i: [4, 0, 12, 4, 4, 4, 14],
  j: [2, 0, 6, 2, 2, 18, 12],
  k: [16, 16, 18, 20, 24, 20, 18],
  l: [12, 4, 4, 4, 4, 4, 14],
  m: [0, 0, 26, 21, 21, 21, 21],
  n: [0, 0, 22, 25, 17, 17, 17],
  o: [0, 0, 14, 17, 17, 17, 14],
  p: [0, 0, 22, 25, 17, 30, 16],
  q: [0, 0, 13, 19, 17, 15, 1],
  r: [0, 0, 22, 25, 16, 16, 16],
  s: [0, 0, 15, 16, 14, 1, 30],
  t: [8, 8, 28, 8, 8, 9, 6],
  u: [0, 0, 17, 17, 17, 19, 13],
  v: [0, 0, 17, 17, 17, 10, 4],
  w: [0, 0, 17, 21, 21, 21, 10],
  x: [0, 0, 17, 10, 4, 10, 17],
  y: [0, 0, 17, 17, 15, 1, 14],
  z: [0, 0, 31, 2, 4, 8, 31],
  '0': [14, 17, 19, 21, 25, 17, 14],
  '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 6, 8, 16, 31],
  '3': [31, 2, 4, 2, 1, 17, 14],
  '4': [2, 6, 10, 18, 31, 2, 2],
  '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [6, 8, 16, 30, 17, 17, 14],
  '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 12, 12],
  ',': [0, 0, 0, 0, 12, 4, 8],
  "'": [4, 4, 8, 0, 0, 0, 0],
  ':': [0, 12, 12, 0, 12, 12, 0],
  ';': [0, 12, 12, 0, 12, 4, 8],
  '!': [4, 4, 4, 4, 4, 0, 4],
  '?': [14, 17, 1, 6, 4, 0, 4],
  '-': [0, 0, 0, 14, 0, 0, 0],
  '(': [2, 4, 8, 8, 8, 4, 2],
  ')': [8, 4, 2, 2, 2, 4, 8],
  '/': [1, 2, 2, 4, 8, 8, 16],
  '&': [12, 18, 20, 8, 21, 18, 13],
  '%': [25, 26, 2, 4, 8, 11, 19],
  '"': [10, 10, 0, 0, 0, 0, 0],
  '+': [0, 4, 4, 14, 4, 4, 0],
  '=': [0, 0, 31, 0, 31, 0, 0],
  '*': [0, 21, 14, 31, 14, 21, 0],
  _: [0, 0, 0, 0, 0, 0, 31],
  $: [4, 15, 20, 14, 5, 30, 4],
  '#': [10, 10, 31, 10, 31, 10, 10],
  '[': [14, 8, 8, 8, 8, 8, 14],
  ']': [14, 2, 2, 2, 2, 2, 14],
  '<': [2, 4, 8, 16, 8, 4, 2],
  '>': [8, 4, 2, 1, 2, 4, 8],
};

function glyphOf(ch: string): number[] {
  return GLYPHS[ch] ?? GLYPHS['?'];
}
function charW(s: number): number {
  return 6 * s;
}
function strW(str: string, s: number): number {
  return str.length === 0 ? 0 : str.length * charW(s) - s;
}
function drawChar(ch: string, x: number, y: number, s: number, c: RGB): void {
  const g = glyphOf(ch);
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if ((g[r] >> (4 - col)) & 1) box(x + col * s, y + r * s, s, s, c);
    }
  }
}
function drawStr(str: string, x: number, y: number, s: number, c: RGB): void {
  let cx = x;
  for (const ch of str) {
    drawChar(ch, cx, y, s, c);
    cx += charW(s);
  }
}
function drawCentred(str: string, cx: number, y: number, s: number, c: RGB): void {
  drawStr(str, cx - Math.floor(strW(str, s) / 2), y, s, c);
}
function wrap(str: string, maxW: number, s: number): string[] {
  const words = str.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur === '' ? w : cur + ' ' + w;
    if (strW(test, s) <= maxW) {
      cur = test;
    } else {
      if (cur !== '') lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}
function drawWrap(str: string, x: number, y: number, maxW: number, s: number, c: RGB, leading: number): number {
  const lines = wrap(str, maxW, s);
  for (let i = 0; i < lines.length; i++) drawStr(lines[i], x, y + i * leading, s, c);
  return lines.length;
}

// ---------------------------------------------------------------- scenes
// Each draws inside (x, y, w, h) with a thin frame.

// 1. Cairo: night highway, an overturned tanker, a huge fireball, black smoke.
function artTanker(x: number, y: number, w: number, h: number): void {
  box(x, y, w, h, NAVY_DARK);
  dot(x + Math.floor(w * 0.82), y + 26, 9, YELLOW);
  dot(x + 40, y + 22, 3, CREAM);
  dot(x + 90, y + 40, 2, CREAM);
  const road = y + Math.floor(h * 0.68);
  box(x, road, w, h - (road - y), STEEL);
  seg(x, road + 14, x + w, road + 14, YELLOW);
  // distant skyline
  box(x + 12, road - 52, 34, 52, NAVY);
  box(x + 300, road - 40, 28, 40, NAVY);
  // the overturned tanker: cylinder on its side, cab crushed
  const tx = x + Math.floor(w * 0.30);
  const ty = road - 26;
  box(tx, ty, 150, 26, CREAM);
  box(tx + 150, ty + 4, 34, 22, RED);
  box(tx + 8, ty + 4, 18, 6, INK);
  seg(tx + 4, ty + 26, tx - 10, ty + 40, INK);
  // fireball rising from the tanker
  const fx = tx + 60;
  const fy = ty - 30;
  dot(fx, fy, 34, ORANGE);
  dot(fx, fy - 6, 24, YELLOW);
  dot(fx + 26, fy + 8, 16, ORANGE);
  dot(fx - 30, fy + 10, 13, ORANGE);
  dot(fx + 8, fy - 34, 12, ORANGE);
  // smoke column
  dot(fx - 8, fy - 58, 16, SMOKE);
  dot(fx + 6, fy - 76, 12, SMOKE);
  dot(fx - 2, fy - 92, 9, SMOKE);
  // a burnt-out car
  box(x + w - 78, road - 12, 46, 12, INK);
  dot(x + w - 66, road - 18, 4, ORANGE);
  frame(x, y, w, h, INK);
}

// 2. Ras Tanura refinery: columns, pipes, a flare flame under a hard sun.
function artRefinery(x: number, y: number, w: number, h: number): void {
  box(x, y, w, h, SKY);
  dot(x + Math.floor(w * 0.78), y + 22, 11, YELLOW);
  const ground = y + Math.floor(h * 0.72);
  box(x, ground, w, h - (ground - y), SAND);
  seg(x, ground, x + w, ground, INK);
  // distillation columns
  box(x + 12, ground - 66, 22, 66, STEEL);
  box(x + 40, ground - 48, 18, 48, STEEL);
  box(x + 64, ground - 80, 24, 80, NAVY);
  box(x + 8, ground - 70, 30, 4, INK);
  box(x + 60, ground - 84, 32, 4, INK);
  // flare flame on the tall column
  tri(x + 70, ground - 96, x + 82, ground - 96, x + 76, ground - 118, ORANGE);
  dot(x + 76, ground - 100, 5, YELLOW);
  // storage tank
  dot(x + 104, ground - 14, 12, CREAM);
  box(x + 92, ground - 26, 24, 26, CREAM);
  // pipeline
  box(x + 6, ground + 12, w - 12, 5, STEEL);
  frame(x, y, w, h, INK);
}

// 3. Tariffs: three rising bars and a red arrow falling across them.
function artTariff(x: number, y: number, w: number, h: number): void {
  box(x, y, w, h, CREAM);
  const base = y + h - 18;
  seg(x + 8, base, x + w - 8, base, INK);
  const bw = 24;
  const gap = 10;
  const bx = x + 14;
  box(bx, base - 34, bw, 34, NAVY);
  box(bx + bw + gap, base - 58, bw, 58, STEEL);
  box(bx + 2 * (bw + gap), base - 88, bw, 88, RED);
  // falling arrow
  seg(x + 12, y + 26, x + w - 16, y + 62, RED);
  seg(x + w - 16, y + 62, x + w - 34, y + 58, RED);
  seg(x + w - 16, y + 62, x + w - 20, y + 44, RED);
  // small percent marks
  dot(x + 22, y + 14, 2, INK);
  dot(x + 34, y + 14, 2, INK);
  frame(x, y, w, h, INK);
}

// 4. Savasleyka: sky, runway, two jets, one hit with a burst.
function artJets(x: number, y: number, w: number, h: number): void {
  box(x, y, w, h, SKY);
  dot(x + Math.floor(w * 0.8), y + 20, 10, YELLOW);
  // clouds
  dot(x + 26, y + 26, 8, CREAM);
  dot(x + 38, y + 24, 6, CREAM);
  const strip = y + Math.floor(h * 0.66);
  box(x, strip, w, h - (strip - y), STEEL);
  seg(x, strip + 12, x + w, strip + 12, YELLOW);
  // jet one, on the strip
  const jx = x + 12;
  const jy = strip - 16;
  tri(jx, jy + 6, jx + 44, jy + 6, jx + 8, jy - 6, NAVY);
  box(jx + 8, jy, 40, 8, NAVY);
  tri(jx + 18, jy, jx + 30, jy, jx + 24, jy - 12, NAVY);
  // jet two, hit: burst above it
  const kx = x + 72;
  const ky = strip - 16;
  tri(kx, ky + 6, kx + 40, ky + 6, kx + 8, ky - 6, STEEL);
  box(kx + 8, ky, 36, 8, STEEL);
  dot(kx + 22, ky - 18, 10, ORANGE);
  dot(kx + 22, ky - 18, 5, YELLOW);
  seg(kx + 22, ky - 30, kx + 22, ky - 44, SMOKE);
  dot(kx + 22, ky - 46, 5, SMOKE);
  frame(x, y, w, h, INK);
}

// 5. North Korea: night sky, a missile on its launcher, stars.
function artMissile(x: number, y: number, w: number, h: number): void {
  box(x, y, w, h, DARK_SKY);
  dot(x + 18, y + 16, 2, CREAM);
  dot(x + 44, y + 30, 2, CREAM);
  dot(x + 96, y + 14, 2, CREAM);
  dot(x + 112, y + 44, 2, CREAM);
  dot(x + 66, y + 10, 2, GOLD);
  const ground = y + Math.floor(h * 0.78);
  box(x, ground, w, h - (ground - y), STEEL);
  // launcher
  tri(x + 30, ground, x + 58, ground, x + 44, ground - 34, INK);
  // missile angled up
  seg(x + 44, ground - 30, x + 78, ground - 96, CREAM);
  seg(x + 44, ground - 30, x + 78, ground - 96, CREAM);
  box(x + 72, ground - 102, 12, 12, RED);
  tri(x + 78, ground - 96, x + 90, ground - 92, x + 78, ground - 84, RED);
  // exhaust glow
  dot(x + 44, ground - 28, 6, ORANGE);
  dot(x + 44, ground - 28, 3, YELLOW);
  frame(x, y, w, h, INK);
}

// ---------------------------------------------------------------- layout
interface Story {
  num: string;
  kicker: string;
  head: string;
  body: string;
  art: (x: number, y: number, w: number, h: number) => void;
}

const STORIES: Story[] = [
  {
    num: '1',
    kicker: 'EGYPT - CAIRO',
    head: 'Tanker fire kills 31 on Cairo ring road',
    body: 'A fuel tanker overturned and exploded on the Ring Road in Giza, killing at least 31 people and injuring 21.',
    art: artTanker,
  },
  {
    num: '2',
    kicker: 'MIDDLE EAST - OIL',
    head: 'Saudi refinery hit; oil tops $94',
    body: "The Houthis claimed strikes on the Ras Tanura refinery. Brent crude jumped past $94 a barrel.",
    art: artRefinery,
  },
  {
    num: '3',
    kicker: 'USA - TRADE',
    head: 'US proposes new tariffs on 14 partners',
    body: 'Washington proposed tariffs of up to 15 percent. Markets fell sharply.',
    art: artTariff,
  },
  {
    num: '4',
    kicker: 'UKRAINE WAR - RUSSIA',
    head: 'Ukraine says it hit five jets at Russian air base',
    body: 'Kyiv said a strike on Savasleyka airfield damaged three MiG-31 jets and two Su-34 bombers.',
    art: artJets,
  },
  {
    num: '5',
    kicker: 'NORTH KOREA',
    head: 'Kim orders wider use of tactical nuclear arms',
    body: 'Kim Jong Un called for tactical nuclear weapons to be deployed more widely across the forces.',
    art: artMissile,
  },
];

function main(): void {
  paint(PAPER);

  // Masthead
  box(0, 0, W, 104, NAVY);
  box(0, 104, W, 4, GOLD);
  drawCentred('THE WORLD IN ONE DAY', W / 2, 16, 4, CREAM);
  drawCentred('Thursday, 26 November 2026', W / 2, 56, 3, GOLD);
  drawStr('FIVE STORIES', 28, 86, 1, CREAM);
  drawStr('MAKE.FUN', W - 28 - strW('MAKE.FUN', 1), 86, 1, CREAM);

  // Lead story: text left, picture right
  const lead = STORIES[0];
  const ly = 124;
  const lh = 316;
  box(24, ly, W - 48, lh, CREAM);
  box(24, ly, 8, lh, RED);
  frame(24, ly, W - 48, lh, INK);
  lead.art(612, ly + 18, 364, lh - 36);
  const tx = 48;
  const tw = 528;
  drawStr(lead.num + '  ' + lead.kicker, tx, ly + 22, 2, RED);
  const headLines = drawWrap(lead.head, tx, ly + 54, tw, 3, INK, 42);
  const bodyY = ly + 54 + headLines * 42 + 10;
  drawWrap(lead.body, tx, bodyY, tw, 2, INK, 26);
  drawStr('31 dead - 21 hurt - 27 vehicles burned', tx, ly + lh - 34, 2, GREY);

  // Grid of four
  const gy = ly + lh + 16;
  const gw = Math.floor((W - 48 - 16) / 2);
  const gh = 216;
  for (let i = 1; i < 5; i++) {
    const st = STORIES[i];
    const col = (i - 1) % 2;
    const row = Math.floor((i - 1) / 2);
    const gx = 24 + col * (gw + 16);
    const gy2 = gy + row * (gh + 16);
    box(gx, gy2, gw, gh, CREAM);
    frame(gx, gy2, gw, gh, INK);
    box(gx, gy2, 30, 30, RED);
    drawCentred(st.num, gx + 15, gy2 + 8, 2, CREAM);
    st.art(gx + 14, gy2 + 42, 130, gh - 56);
    const bx = gx + 158;
    const bw = gx + gw - 14 - bx;
    drawStr(st.kicker, bx, gy2 + 14, 2, RED);
    const hl = drawWrap(st.head, bx, gy2 + 40, bw, 2, INK, 26);
    drawWrap(st.body, bx, gy2 + 40 + hl * 26 + 6, bw, 2, INK, 26);
  }

  // Footer
  const fy = gy + 2 * gh + 16 + 14;
  box(24, fy, W - 48, 3, INK);
  drawCentred('Five stories that shaped Thursday, 26 November 2026', W / 2, fy + 12, 2, INK);
  drawCentred('Sources: Reuters, AP, AFP  -  Drawn in code, no photographs', W / 2, fy + 40, 1, GREY);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const png = encodePng(px, W, H);
  writeFileSync(join(outDir, 'entry.png'), png);
  console.log('wrote ' + join(outDir, 'entry.png') + ' ' + png.length + ' bytes');
}

main();
