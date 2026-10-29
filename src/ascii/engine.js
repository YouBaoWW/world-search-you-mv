/* Character-grid engine. Everything is a pure function of time t, so the
   headless renderer can ask for any frame in any order. */
(function () {
  const MV = (window.MV = window.MV || {});

  MV.COLS = 128; MV.ROWS = 45; MV.CW = 10; MV.CH = 16;

  // Styles. D/N/B/W/R/G/K are the reference project's ANSI ramp (137/215/221/230/203/94/58).
  // BO = Bonnie (pink-violet, from her wiki avatar), P/FB = Fanny (gold hair, navy coat), C = search UI.
  const ST = (MV.ST = { D: 0, N: 1, B: 2, W: 3, R: 4, RB: 5, P: 6, PB: 7, C: 8, G: 9, K: 10, A: 11, S: 12, Y: 13, CB: 14, BO: 15, BOL: 16, FB: 17, BLK: 18 });
  MV.PALETTE = [
    '#af875f', '#ffaf5f', '#ffd75f', '#ffffd7', // D N B W
    '#ff5f5f', '#ff8f8f',                       // R RB  (error)
    '#ffc24a', '#ffe8a8',                       // P PB  (Fanny gold)
    '#5fd7ff', '#875f00', '#5f5f00',            // C G K
    '#87d75f', '#ffe2c4', '#ffe066', '#c8f4ff', // A S Y CB
    '#ff5faf', '#ffafd7', '#6f8cff', '#000000', // BO BOL FB BLK
  ];
  MV.BG = '#07070b';

  const mix = (MV.mix = (a, b, u) => a + (b - a) * u);
  const clamp = (MV.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)));
  MV.smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
  MV.easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
  MV.easeIn = (u) => Math.pow(clamp(u), 3);
  MV.seg = (u, a, b) => clamp((u - a) / (b - a));

  const hash16 = (MV.hash16 = (i) => {
    let v = ((i | 0) + 0x9e3779b9) >>> 0;
    v = Math.imul(v ^ (v >>> 16), 0x7feb352d) >>> 0;
    v = Math.imul(v ^ (v >>> 15), 0x846ca68b) >>> 0;
    return (v ^ (v >>> 16)) & 65535;
  });
  MV.rnd = (i) => hash16(i) / 65536;

  const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦　-〿]/;
  const cw = (MV.cw = (ch) => (WIDE.test(ch) ? 2 : 1));
  MV.width = (s) => { let n = 0; for (const ch of s) n += cw(ch); return n; };

  class Grid {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.ch = new Array(w * h).fill(' ');
      this.st = new Uint8Array(w * h);
      // Optional true colour per cell (0xRRGGBB, -1 = use the style palette).
      this.rgb = new Int32Array(w * h).fill(-1);
      this.bg = new Int32Array(w * h).fill(-1); // cell background (0xRRGGBB), used by half-block pixel art
      this.clip = null;
    }
    get(x, y) { return [this.ch[y * this.w + x], this.st[y * this.w + x]]; }
    set(x, y, ch, st, rgb = -1, bg = -1) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const c = this.clip;
      if (c && (x < c[0] || y < c[1] || x > c[2] || y > c[3])) return;
      const i = y * this.w + x;
      this.ch[i] = ch; this.st[i] = st; this.rgb[i] = rgb; this.bg[i] = bg;
    }
    put(x, y, s, st = ST.N) {
      x = Math.round(x); y = Math.round(y);
      for (const ch of String(s)) {
        const k = cw(ch);
        if (ch !== '\u0000') {
          this.set(x, y, ch, st);
          if (k === 2) this.set(x + 1, y, '', st);
        }
        x += k;
      }
    }
    // Like put, but spaces are transparent.
    over(x, y, s, st = ST.N) {
      x = Math.round(x);
      for (const ch of String(s)) {
        const k = cw(ch);
        if (ch !== ' ') { this.set(x, y, ch, st); if (k === 2) this.set(x + 1, y, '', st); }
        x += k;
      }
    }
    center(y, s, st = ST.N, cx = this.w / 2) { this.put(Math.round(cx - MV.width(s) / 2), y, s, st); }
    clear(x, y, w, h) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ' ', ST.K); }
    fill(x, y, w, h, ch, st) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch, st); }
    line(x0, y0, x1, y1, ch = '.', st = ST.D) {
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.2));
      for (let i = 0; i <= n; i++) { const u = i / n; this.set(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, ch, st); }
    }
    box(x, y, w, h, st = ST.D, title = '') {
      if (w < 2 || h < 2) return;
      this.put(x, y, '+' + '-'.repeat(w - 2) + '+', st);
      this.put(x, y + h - 1, '+' + '-'.repeat(w - 2) + '+', st);
      for (let yy = y + 1; yy < y + h - 1; yy++) { this.set(x, yy, '|', st); this.set(x + w - 1, yy, '|', st); }
      if (title) this.put(x + 2, y, ' ' + title + ' ', st === ST.D ? ST.N : st);
    }
    panel(x, y, w, h, st = ST.D, title = '') { this.clear(x, y, w, h); this.box(x, y, w, h, st, title); }
    bar(x, y, w, u, st = ST.B) {
      const n = Math.round((w - 2) * clamp(u));
      this.put(x, y, '[' + '#'.repeat(n) + '.'.repeat(w - 2 - n) + ']', st);
    }
    // 5x5 block font, scaled. ch picks the ink character.
    big(y, text, st = ST.B, sx = 1, sy = 1, ink = '#', cx = this.w / 2) {
      text = text.toUpperCase();
      const total = (text.length * 6 - 1) * sx;
      const left = Math.round(cx - total / 2);
      for (let i = 0; i < text.length; i++) {
        const rows = FONT[text[i]] || FONT[' '];
        for (let dy = 0; dy < 5 * sy; dy++) {
          const row = rows[Math.floor(dy / sy)];
          for (let dx = 0; dx < 5 * sx; dx++)
            if (row[Math.floor(dx / sx)] === '1') this.set(left + i * 6 * sx + dx, y + dy, ink, st);
        }
      }
    }
    // Paint a cell bitmap (from rasterText) with a per-cell callback.
    stamp(bm, x0, y0, fn) {
      for (let y = 0; y < bm.h; y++) for (let x = 0; x < bm.w; x++)
        if (bm.d[y * bm.w + x]) fn(x0 + x, y0 + y, x, y);
    }
  }
  MV.Grid = Grid;

  const FONT = (MV.FONT = {
    A: ['01110', '11011', '11111', '11011', '11011'], B: ['11110', '11011', '11110', '11011', '11110'],
    C: ['01111', '11000', '11000', '11000', '01111'], D: ['11110', '11011', '11011', '11011', '11110'],
    E: ['11111', '11000', '11110', '11000', '11111'], F: ['11111', '11000', '11110', '11000', '11000'],
    G: ['01111', '11000', '11011', '11011', '01111'], H: ['11011', '11011', '11111', '11011', '11011'],
    I: ['11111', '00100', '00100', '00100', '11111'], J: ['00111', '00011', '00011', '11011', '01110'],
    K: ['11011', '11110', '11100', '11110', '11011'], L: ['11000', '11000', '11000', '11000', '11111'],
    M: ['10001', '11011', '10101', '10001', '10001'], N: ['11001', '11101', '11111', '10111', '10011'],
    O: ['01110', '11011', '11011', '11011', '01110'], P: ['11110', '11011', '11110', '11000', '11000'],
    Q: ['01110', '11011', '11011', '01110', '00011'], R: ['11110', '11011', '11110', '11101', '11011'],
    S: ['01111', '11000', '01110', '00011', '11110'], T: ['11111', '00100', '00100', '00100', '00100'],
    U: ['11011', '11011', '11011', '11011', '01110'], V: ['11011', '11011', '11011', '01110', '00100'],
    W: ['10001', '10001', '10101', '11011', '10001'], X: ['11011', '01110', '00100', '01110', '11011'],
    Y: ['11011', '11011', '01110', '00100', '00100'], Z: ['11111', '00011', '00110', '01100', '11111'],
    0: ['01110', '11011', '11011', '11011', '01110'], 1: ['00100', '01100', '00100', '00100', '01110'],
    2: ['11110', '00011', '01110', '11000', '11111'], 3: ['11110', '00011', '01110', '00011', '11110'],
    4: ['11011', '11011', '11111', '00011', '00011'], 5: ['11111', '11000', '11110', '00011', '11110'],
    6: ['01111', '11000', '11110', '11011', '01110'], 7: ['11111', '00011', '00110', '01100', '01100'],
    8: ['01110', '11011', '01110', '11011', '01110'], 9: ['01110', '11011', '01111', '00011', '11110'],
    ';': ['00000', '00100', '00000', '00100', '01000'], '.': ['00000', '00000', '00000', '00000', '00100'],
    '(': ['00010', '00100', '00100', '00100', '00010'], ')': ['01000', '00100', '00100', '00100', '01000'],
    '-': ['00000', '00000', '11111', '00000', '00000'], '#': ['01010', '11111', '01010', '11111', '01010'],
    '?': ['01110', '10011', '00110', '00000', '00100'], '%': ['11001', '11010', '00100', '01011', '10011'],
    '/': ['00001', '00010', '00100', '01000', '10000'], ':': ['00000', '00100', '00000', '00100', '00000'],
    "'": ['00100', '00100', '00000', '00000', '00000'], '!': ['00100', '00100', '00100', '00000', '00100'],
    ' ': ['00000', '00000', '00000', '00000', '00000'],
  });

  // Block-font bitmap: lines = [[text, sx, sy], ...], centred, gap rows between lines.
  MV.blockText = function (lines, gap = 2) {
    const ws = lines.map(([s, sx]) => (s.length * 6 - 1) * sx), w = Math.max(...ws);
    const h = lines.reduce((a, [, , sy]) => a + 5 * sy, 0) + gap * (lines.length - 1);
    const d = new Uint8Array(w * h);
    let y0 = 0;
    lines.forEach(([s, sx, sy], li) => {
      const x0 = Math.floor((w - ws[li]) / 2);
      [...s.toUpperCase()].forEach((c, i) => {
        const rows = FONT[c] || FONT[' '];
        for (let y = 0; y < 5 * sy; y++) for (let x = 0; x < 5 * sx; x++)
          if (rows[Math.floor(y / sy)][Math.floor(x / sx)] === '1') d[(y0 + y) * w + x0 + i * 6 * sx + x] = 1;
      });
      y0 += 5 * sy + gap;
    });
    const bm = { w, h, d, ink: [] };
    for (let i = 0; i < d.length; i++) if (d[i]) bm.ink.push([i % w, Math.floor(i / w)]);
    return bm;
  };

  MV.FONT_MONO = "'JetBrains Mono','Cascadia Mono',Consolas,monospace";
  MV.FONT_RETRO = "'VT323','JetBrains Mono',monospace";
  MV.FONT_CJK = "'Microsoft YaHei','PingFang SC','Noto Sans CJK SC',sans-serif";
  MV.FONT_UI = "'Inter','Microsoft YaHei','PingFang SC',sans-serif";

  // Rasterise any text (CJK included) into a cols x rows cell bitmap.
  const RASTER = new Map();
  MV.rasterText = function (text, cols, rows, weight = 900) {
    const key = text + '|' + cols + '|' + rows + '|' + weight;
    if (RASTER.has(key)) return RASTER.get(key);
    const S = 6, cv = document.createElement('canvas');
    // Cells are 10x16, so draw on a canvas with the same aspect and sample per cell.
    cv.width = cols * S; cv.height = Math.round(rows * S * MV.CH / MV.CW);
    const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.textAlign = 'center';
    let size = cv.height * 0.95;
    x.font = `${weight} ${size}px ${MV.FONT_UI}`;
    const m = x.measureText(text).width;
    if (m > cv.width * 0.98) { size *= (cv.width * 0.98) / m; x.font = `${weight} ${size}px ${MV.FONT_UI}`; }
    x.fillText(text, cv.width / 2, cv.height / 2 + size * 0.04);
    const img = x.getImageData(0, 0, cv.width, cv.height).data;
    const d = new Uint8Array(cols * rows), ch = cv.height / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let s = 0, n = 0;
      for (let yy = Math.floor(r * ch); yy < Math.floor((r + 1) * ch); yy += 2)
        for (let xx = c * S; xx < (c + 1) * S; xx += 2) { s += img[(yy * cv.width + xx) * 4]; n++; }
      d[r * cols + c] = s / n / 255 > 0.42 ? 1 : 0;
    }
    const bm = { w: cols, h: rows, d, ink: [] };
    for (let i = 0; i < d.length; i++) if (d[i]) bm.ink.push([i % cols, Math.floor(i / cols)]);
    RASTER.set(key, bm);
    return bm;
  };

  // Shaded ellipsoid (apple, planets, orbs). light is an angle in radians.
  MV.sphere = function (g, cx, cy, rx, ry, light, st, ramp = ' .:-=+*#%@') {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry, r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2);
        const l = clamp(0.25 + 0.75 * (nx * Math.cos(light) * 0.7 + ny * -0.45 + nz * 0.6));
        g.set(x, y, ramp[Math.min(ramp.length - 1, Math.floor(l * ramp.length))], typeof st === 'function' ? st(l) : st);
      }
  };

  // ECG-like waveform sample, phase in [0,1).
  MV.ecg = function (p) {
    p = ((p % 1) + 1) % 1;
    if (p < 0.08) return Math.sin(p / 0.08 * Math.PI) * 0.15;
    if (p < 0.12) return -0.15;
    if (p < 0.16) return 1;
    if (p < 0.2) return -0.35;
    if (p < 0.36) return Math.sin((p - 0.2) / 0.16 * Math.PI) * 0.25;
    return 0;
  };

  // Grid-level corruption, ported from the reference apply_glitch.
  MV.glitch = function (g, t, k, top, bot) {
    if (k < 0.01) return;
    const f = Math.floor(t * 24), W = g.w;
    if (hash16(f) % 100 < k * 30) {
      for (let i = 0; i < Math.floor(k * 5); i++) {
        const row = top + (hash16(f + i * 7) % (bot - top + 1));
        const sh = Math.round(((hash16(f + i * 13) % 20) - 10) * k);
        if (!sh) continue;
        const a = g.ch.slice(row * W, row * W + W), b = g.st.slice(row * W, row * W + W);
        for (let x = 0; x < W; x++) { const s = (x - sh + W) % W; g.ch[row * W + x] = a[s]; g.st[row * W + x] = b[s]; }
      }
    }
    if (hash16(f + 100) % 100 < k * 40)
      for (let i = 0; i < Math.floor(k * 15); i++) {
        const x = 2 + (hash16(f + i * 19) % (W - 4)), y = top + (hash16(f + i * 23) % (bot - top + 1));
        g.st[y * W + x] = k > 0.7 ? ST.R : k > 0.4 ? ST.W : ST.B;
      }
    if (k > 0.4)
      for (let i = 0; i < Math.floor((k - 0.3) * 4); i++) {
        const row = top + (Math.floor(t * 17 + i * 31) % (bot - top + 1));
        for (let x = 2; x < W - 2; x++) if (hash16(x + f) % 100 < k * 60) {
          const j = row * W + x; if (g.ch[j] === ' ') g.ch[j] = '='; g.st[j] = ST.W;
        }
      }
    if (k > 0.6)
      for (let i = 0; i < Math.floor((k - 0.6) * 20); i++) {
        if (hash16(f + i) % 100 >= (k - 0.6) * 100) continue;
        const x = 2 + (hash16(f + i * 31) % (W - 12)), y = top + (hash16(f + i * 37) % Math.max(1, bot - top - 3));
        const w = 3 + (hash16(i * 41) % 8), h = 2 + (hash16(i * 43) % 4);
        for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++)
          g.set(x + dx, y + dy, '█▓▒░#@%$'[hash16(dx + dy * 3) % 8], hash16(i) % 3 === 0 ? ST.R : ST.W);
      }
  };

})();
