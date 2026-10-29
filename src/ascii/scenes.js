/* ASCII-layer shots S01-S12 (CRT -> CCFL LCD), in the reference project's
   program-interface language: dense data, rails, init checks, data-filled shapes.
   Each scene gets c = { g, t, e, d, u, A, fx, pulse, beat }. */
(function () {
  const MV = window.MV, ST = MV.ST, { mix, clamp, seg, smooth, easeOut, easeIn, rnd, hash16 } = MV;
  const typed = (s, e, cps = 28) => [...s].slice(0, Math.max(0, Math.floor(e * cps))).join('');
  const blink = (t, hz = 2) => Math.floor(t * hz * 2) % 2 === 0;
  const HEX = '0123456789ABCDEF';
  const NOISE = '01{}()<>[];:=+-*/#%&@$?ABCDEF';
  const hex4 = (v) => (v & 65535).toString(16).toUpperCase().padStart(4, '0');

  // ---------- shared pieces ----------

  // Dim program glyphs scattered over the whole area (the reference cover's ground).
  function ambient(g, A, t, density = 0.05) {
    const f = Math.floor(t * 4);
    for (let y = A.t; y <= A.b; y++) for (let x = A.l; x <= A.r; x++) {
      const h = rnd(x * 7919 + y * 104729);
      if (h > density) continue;
      g.set(x, y, NOISE[hash16(x * 31 + y * 17 + Math.floor(f * (0.3 + h * 4))) % NOISE.length], h < density * 0.2 ? ST.D : ST.G);
    }
  }

  // Scrolling memory / instruction rails on both sides (after the reference "MEM / YOU · EXEC / ME").
  function rails(g, A, t, left, right, opt = {}) {
    const rail = Math.max(13, Math.min(20, Math.floor(g.w / 7))), speed = opt.speed || 10;
    const ops = opt.ops || ['READ', 'SCAN', 'SEEK', 'LOAD', 'DIFF', 'MARK', 'TRACE', 'WAIT'];
    const frame = Math.floor(t * speed);
    [[A.l, left, 0], [A.r - rail + 1, right, 1]].forEach(([x, label, side]) => {
      if (!label) return;
      g.box(x, A.t, rail, A.h, ST.B);
      g.put(x + 2, A.t, label.slice(0, rail - 4), ST.W);
      for (let row = A.t + 1; row < A.b; row++) {
        const idx = side === 0 ? frame + (row - A.t) : frame - (row - A.t);
        const v = hash16(idx * 73 + side * 911), addr = (idx * 16) & 65535;
        const text = side === 0 ? `${hex4(addr)} ${hex4(v)} ${hex4(hash16(idx * 29))}` : `${ops[(idx % ops.length + ops.length) % ops.length]} ${hex4(addr)} ${hex4(v)}`;
        const sel = ((row - A.t + frame) % (A.h - 2) + (A.h - 2)) % (A.h - 2) === 0;
        g.put(x + 1, row, ((sel ? '>' : ' ') + text).slice(0, rail - 2), sel ? ST.W : idx % 3 ? ST.N : ST.G);
      }
    });
    return { l: A.l + rail + 2, r: A.r - rail - 2, t: A.t, b: A.b, w: A.w - rail * 2 - 4, h: A.h, cx: A.cx, cy: A.cy };
  }

  // "NAME .......... [ OK ]" checklist, items appearing at their own times.
  function checks(g, x, y, w, list, e) {
    list.forEach(([name, status, at, st], i) => {
      if (e < at) return;
      g.put(x, y + i, name, ST.N);
      g.put(x + name.length, y + i, '.'.repeat(Math.max(2, w - name.length - status.length - 4)), ST.G);
      g.put(x + w - status.length - 4, y + i, `[ ${status} ]`, st ?? ST.B);
    });
  }

  // Typed lines: [text, at, style]. The line being typed gets a cursor.
  function lines(g, x, y, list, e, cps = 60) {
    let yy = y;
    list.forEach(([s, at, st]) => {
      if (e < at) return;
      if (s) {
        const shown = typed(s, e - at, cps);
        g.put(x, yy, shown, st ?? ST.N);
        if (shown.length < s.length) g.put(x + MV.width(shown), yy, '_', ST.W);
      }
      yy++;
    });
    return yy;
  }

  function fields(g, x, y, rows, e, keyW, gap = 0.45, step = 2) {
    rows.forEach(([k, v, st], i) => {
      const le = e - i * gap;
      if (le <= 0) return;
      g.put(x, y + i * step, k.padEnd(keyW), ST.D);
      g.put(x + keyW, y + i * step, typed(v, le, 30), st ?? ST.W);
    });
  }

  // Square-ish pixel avatar placed by its bottom-centre.
  function avatar(g, name, cx, by, cols, opt = {}) {
    const rows = MV.pixelArtRows(cols);
    MV.pixelArt(g, Math.round(cx - cols / 2), Math.round(by - rows), name, { cols, ...opt });
    return rows;
  }

  // ---------------- Chapter 1 · amber CRT ----------------
  function boot({ g, t, e, d, A }) {
    const p = e / d, l = A.l + 2;
    g.center(A.t, 'GRAYSON TERMINAL 006 - POWER ON SELF TEST', ST.W);
    g.put(A.l, A.t + 1, '-'.repeat(A.w), ST.G);
    const y = lines(g, l, A.t + 3, [
      ['BIOS v0.06 - GRAYSON DETECTIVE AGENCY', 0.0, ST.W],
      ['Copyright (C) 1983 Union City Bureau Net', 0.25, ST.N],
      ['', 0.4],
      ['Main Processor  : Deduction Core v6.0', 0.55, ST.N],
      [`Memory Test     : ${Math.min(65536, Math.floor(Math.max(0, e - 0.7) * 60000))}K ${e > 1.8 ? 'OK' : ''}`, 0.7, ST.B],
      ['Primary Master  : CASE_INDEX.DB', 1.2, ST.N],
      ['Primary Slave   : MAGNIFIER.SYS', 1.4, ST.N],
      ['Secondary Master: POISON_APPLE.DLL', 1.6, ST.N],
      ['', 1.8],
      ['Detecting agents...', 2.0, ST.G],
      ['AGENT 006 : [BONNIE] online', 2.4, ST.B],
      ['AGENT 007 : [FANNY]  ---- no response', 2.8, ST.R],
    ], e, 70);
    // Memory test bars in the right half, beside the POST text.
    if (e > 1.0) {
      const bp = clamp((e - 1.0) / 2.6), bx = A.l + Math.round(A.w * 0.5), bw = A.r - bx - 8;
      ['MEM', 'IDX', 'LNK'].forEach((lab, i) => {
        const k = clamp(bp * (1.15 - i * 0.12)) * (i === 2 ? 0.37 : 1), n = Math.floor(bw * k);
        g.put(bx, A.t + 4 + i * 2, lab + ':', ST.N);
        g.put(bx + 5, A.t + 4 + i * 2, '[' + '='.repeat(n) + ' '.repeat(bw - n) + ']', i === 2 && bp > 0.9 ? ST.R : i ? ST.N : ST.B);
        g.put(bx + bw + 7, A.t + 4 + i * 2, i === 2 && bp > 0.9 ? 'ERR' : `${Math.round(k * 100)}%`, i === 2 && bp > 0.9 ? ST.R : ST.W);
      });
    }
    checks(g, l + 2, y + 1, Math.min(56, A.w - 6), [
      ['POWER SUPPLY', 'OK', 3.3], ['MAGNIFIER LENS', 'OK', 3.7], ['DEDUCTION ENGINE', 'OK', 4.1],
      ['CASE INDEX', 'OK', 4.5], ['LINK TO AGENT 007', 'LOST', 5.0, ST.R],
    ], e);
    if (p > 0.85) g.center(A.b, 'SYSTEM READY - OPEN CASE #007 ?', blink(t) ? ST.W : ST.B);
    if (blink(t, 1.5)) g.put(l, A.b - 1, '_', ST.W);
  }

  function casefile({ g, t, e, d, A }) {
    // The screen fills with case data row by row, then the dossier window opens over it.
    const rows = Math.floor(clamp(e / 2.4) * A.h);
    for (let y = 0; y < rows; y++) {
      let x = A.l, k = 0;
      while (x < A.r - 4) {
        const v = hash16((A.t + y) * 977 + k * 13 + Math.floor(t * (y === rows - 1 ? 20 : 1)));
        g.put(x, A.t + y, hex4(v), y === rows - 1 ? ST.W : v % 7 === 0 ? ST.B : ST.G);
        x += 5; k++;
      }
    }
    if (e < 2.0) return;
    const w = Math.min(72, A.w - 8), h = Math.min(A.h - 2, 21), x = Math.round(A.cx - w / 2), y = A.t + 1;
    g.panel(x, y, w, h, ST.B, 'CASE FILE #007');
    const p = clamp((e - 2.0) / 1.6);
    g.put(x + 3, y + 2, 'RETRIEVING DOSSIER', ST.D);
    g.bar(x + 22, y + 2, w - 32, p, ST.B);
    g.put(x + w - 8, y + 2, String(Math.round(p * 100)).padStart(3) + '%', ST.W);
    if (e > 3.6) fields(g, x + 3, y + 5, [
      ['TYPE', 'MISSING PERSON'], ['SUBJECT', 'FANNY CRAIG  [007]'], ['AFFILIATION', 'GRAYSON DETECTIVE AGENCY'],
      ['LAST SEEN', 'THE NIGHT OF THE FALL'], ['ASSIGNED', 'AGENT 006  BONNIE'],
    ], e - 3.6, 14, 0.3);
    if (e > 5.4) { g.put(x + 3, y + 16, 'STATUS', ST.D); g.put(x + 17, y + 16, blink(t, 1.5) ? '## MISSING ##' : '   MISSING   ', ST.R); }
    if (e > 6.0) g.put(x + 3, y + h - 2, '> ' + typed('open case 007 --search', e - 6.0, 20) + (blink(t) ? '_' : ''), ST.W);
  }

  function query({ g, t, e, d, fx, shot }) {
    const cmd = 'C:\\CASE007> world.search(you);';
    // Song-time cues: typing, [ENTER], scramble, title lock on the full-band entry, fall.
    const S = t - e, P = shot.p;
    const type0 = P.type - S, typeEnd = P.enter - S, lockA = P.scramble - S, lockB = P.lock - S, fall0 = P.fall - S;
    const cps = [...cmd].length / Math.max(0.5, typeEnd - type0 - 0.3), f = Math.floor(t * 24);
    const A = { l: 1, t: 1, r: g.w - 2, b: g.h - 2 };
    const big = g.w >= 150 ? 2 : 1;
    const tb = MV.blockText([['WORLD.', 2 * big, 2 * big], ['SEARCH(YOU);', big, 2 * big]], 2);
    const tx = Math.round((g.w - tb.w) / 2), ty = Math.max(3, Math.round(g.h * 0.44 - tb.h / 2));
    if (e < lockA) {
      ambient(g, A, t, 0.02 + seg(e, typeEnd - 0.4, lockA) * 0.6);
      const cy = Math.round(g.h * 0.5);
      avatar(g, 'bonnie', Math.round(g.w * 0.8), cy + 6, 22, { mode: 'mix', settle: seg(e, 0.2, 1.8), t });
      g.put(4, cy, typed(cmd, e - type0, cps) + (blink(t) ? '█' : ''), ST.W);
      if (e > typeEnd) { fx.flash = 0.25 * (1 - seg(e, typeEnd, lockA)); g.put(4, cy + 2, '[ENTER]', ST.B); }
      return;
    }
    // Everything scrambles across the screen, then reforms as the title, letters filled with binary.
    const lock = smooth(seg(e, lockA, lockB)), fall = easeIn(seg(e, fall0, d));
    ambient(g, A, t, 0.13 * (1 - lock * 0.6));
    tb.ink.forEach(([ix, iy], i) => {
      const sx = rnd(i * 3 + 1) * g.w, sy = rnd(i * 7 + 2) * g.h;
      const k = smooth(clamp(lock * 1.4 - rnd(i * 11) * 0.4));
      const x = mix(sx, tx + ix, k), y = mix(sy, ty + iy, k) + fall * (rnd(i * 5) * 0.8 + 0.4) * g.h;
      const done = k > 0.98;
      const ch = done ? '01'[hash16(i * 7 + Math.floor(t * 3)) % 2] : NOISE[hash16(i + f) % NOISE.length];
      // Landed cells get a solid ground so the letters read as shapes, binary printed inside.
      if (done) g.set(x, y, ch, ST.BLK, rnd(i * 13 + Math.floor(t * 2)) < 0.1 ? 0xffffd7 : -1, 0xffaf5f);
      else g.set(x, y, ch, ST.N);
    });
    if (lock > 0.6) { g.center(2, 'M I L I', ST.W); g.center(g.h - 3, 'world.search(you);', ST.W); }
    if (lock > 0.95 && fall < 0.05) g.center(ty + tb.h + 2, 'BONNIE  x  FANNY   ·   CASE #007', ST.N);
    if (e >= lockB && e < lockB + 0.3) fx.flash = 0.5 * (1 - (e - lockB) / 0.3);
  }

  // ---------------- Chapter 2 · EGA CRT ----------------
  function bonnie({ g, t, e, d, A }) {
    const M = rails(g, A, t, 'MEM / 006', 'TRACE / 007');
    const cols = Math.min(26, Math.floor(M.w * 0.36)), portraitBottom = M.t + MV.pixelArtRows(cols) + 1;
    const ax = M.l + cols / 2 + 1, slide = easeOut(e / 1.6);
    const keep = g.clip; g.clip = [M.l, M.t, M.r, portraitBottom - 1];
    avatar(g, 'bonnie', ax - (1 - slide) * 30, portraitBottom, cols, { mode: 'mix', settle: seg(e, 0.4, 3), t, reveal: seg(e, 0, 1.2) });
    g.clip = keep;
    if (e < 2.4) { const sy = Math.round(mix(M.t, portraitBottom - 1, e / 2.4)); for (let x = M.l; x < M.l + cols + 2; x++) g.set(x, sy, '=', ST.W); }
    const px = M.l + cols + 3, pw = M.r - px;
    if (e > 1.0 && pw > 24) {
      g.panel(px, M.t, pw, Math.min(M.h, 17), ST.B, 'AGENT 006');
      fields(g, px + 2, M.t + 2, [
        ['SUBJECT', 'BONNIE  邦妮', ST.BOL], ['ALIAS', 'POISON APPLE 毒苹果'], ['ID', 'No.006'],
        ['DEGREE', 'PhD LAW · 中城大学'], ['TRADE', 'DETECTIVE · 联合城'], ['CREDO', 'RESULTS. BY ANY MEANS.', ST.BO],
      ], e - 1.2, 10, 0.45);
    }
    if (e > 4.5 && M.h > 22) {
      const sx = M.r - 8, sy = M.t + 20;
      MV.sphere(g, sx, sy, 5, 3, t * 2.4, ST.R, ' .:-=+*#%@');
      g.put(sx, sy - 4, ')', ST.A);
      g.put(px + 2, sy - 1, 'IF (RESULT) -> ANY_MEANS', ST.N);
      g.put(px + 2, sy + 1, 'APPLE.STOCK = ' + (12 - Math.floor(e % 12)), ST.D);
    }
    g.center(M.b, 'AGENT 006 / ' + (blink(t, 1) ? 'ONLINE' : 'ONLINE_'), ST.B, (M.l + M.r) / 2);
  }

  function fanny({ g, t, e, d, A }) {
    const M = rails(g, A, t, 'MEM / 007', 'LOG / LOST', { ops: ['READ', 'NULL', 'ERR', 'SEEK', 'NULL', 'LOST'] });
    const cols = Math.min(26, Math.floor(M.w * 0.36)), ax = M.r - cols / 2 - 1;
    const portraitBottom = M.t + MV.pixelArtRows(cols) + 1;
    avatar(g, 'fanny', ax, portraitBottom, cols, { mode: 'mix', settle: 0.7, t, reveal: seg(e, 0.3, 4), corrupt: 0.22 + 0.18 * Math.sin(t * 7) ** 2 });
    g.put(Math.round(ax - cols / 2), M.t, 'PHOTO DATA CORRUPTED · ' + Math.round(clamp(e / 8) * 41) + '%', blink(t, 1) ? ST.P : ST.D);
    const sy = Math.round(mix(M.t + 1, portraitBottom - 1, (e * 0.45) % 1));
    for (let x = Math.round(ax - cols / 2); x < ax + cols / 2; x++) g.set(x, sy, '-', ST.PB);
    fields(g, M.l + 1, M.t + 2, [
      ['SUBJECT', 'FANNY CRAIG 芬妮', ST.PB], ['ID', 'No.007'], ['AGENCY', 'GRAYSON 侦探事务所'], ['SKILL', 'ANALYSIS MAGIC'],
      ['BIRTHDAY', '02 / 17'], ['LIKES', 'STRAWBERRY CAKE'], ['CARRIES', 'MAGNIFIER · CAMERA'], ['LAST SEEN', 'THE FALL'],
    ], e - 0.8, 11, 0.55);
    if (e > 6) { g.put(M.l + 1, M.t + 18, 'STATUS', ST.D); g.put(M.l + 12, M.t + 18, blink(t, 1.5) ? '## MISSING ##' : '   MISSING   ', ST.R); }
  }

  function rivals({ g, t, e, u, A, pulse }) {
    ambient(g, A, t, 0.03);
    const cx = Math.round(A.cx);
    for (let y = A.t; y <= A.b; y++) {
      const z = Math.round(Math.sin(y * 1.7 + t * 9) * (1 + pulse * 2));
      g.set(cx + z, y, '|', ST.W);
      if (rnd(y * 31 + Math.floor(t * 20)) < 0.25 + pulse * 0.4) g.set(cx + z + (rnd(y + Math.floor(t * 30)) < 0.5 ? -2 : 2), y, '*+'[y % 2], ST.Y);
    }
    const cols = Math.min(30, Math.floor(A.w * 0.24)), lost = seg(u, 0.75, 1);
    avatar(g, 'bonnie', A.l + A.w * 0.25, A.b, cols, { t, mode: 'block' });
    avatar(g, 'fanny', A.l + A.w * 0.75, A.b, cols, { t, mode: 'mix', settle: 1 - lost, dissolve: lost * 0.9, corrupt: 0.08 + lost * 0.4 });
    g.big(A.t, '006', ST.BO, 1, 1, '#', A.l + A.w * 0.25);
    g.big(A.t, '007', lost > 0.5 && blink(t, 3) ? ST.D : ST.P, 1, 1, '#', A.l + A.w * 0.75);
    g.center(A.t + 6, 'SAME CLASS · SAME RANK · NEVER GOT ALONG', ST.W, cx);
    if (lost > 0.3) g.center(A.t + 8, 'No.007 : NO SIGNAL', ST.R, A.l + A.w * 0.75);
  }

  // ---------------- Chapter 3 · Trinitron ----------------
  const MARKS = { agency: [0.14, 0.3, 'GRAYSON'], uni: [0.42, 0.18, '中城大学'], tower: [0.66, 0.36, 'CLOCK TOWER'],
                  harbor: [0.3, 0.8, 'SOUTH HARBOR'], impact: [0.86, 0.76, 'IMPACT'] };
  function cityMap(g, A, t, mw, mh) {
    const x0 = A.l, y0 = A.t;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
      const bx = Math.floor(x / 9), by = Math.floor(y / 4), lx = x % 9, ly = y % 4;
      if (lx === 0 || ly === 0 || (bx % 3 === 0 && lx < 2)) { if ((x + y) % 4 === 0) g.set(x0 + x, y0 + y, '.', ST.G); continue; }
      const h = hash16(bx * 97 + by * 13);
      if (h % 7 === 0) { if ((x * y) % 5 === 1) g.set(x0 + x, y0 + y, '"', ST.A); continue; }
      if (h % 11 === 0) { g.set(x0 + x, y0 + y, '~', ST.C); continue; }
      g.set(x0 + x, y0 + y, '01#'[(hash16(x * 7 + y * 131 + bx) % 9) < 2 ? hash16(x + y) % 2 : 2], h % 3 === 0 ? ST.D : ST.G);
    }
    const P = {};
    for (const k in MARKS) {
      const [mx, my, name] = MARKS[k], px = Math.round(x0 + mx * mw), py = Math.round(y0 + my * mh);
      P[k] = [px, py];
      g.put(px - 1, py, '[+]', k === 'impact' ? ST.Y : ST.N);
      g.put(px + 3, py, name, ST.W);
    }
    return P;
  }
  function sidePanel(g, A, mw, title, st = ST.C) {
    const x = A.l + mw + 2, w = A.r - x;
    g.panel(x, A.t, w, A.h, st, title);
    return { x: x + 2, y: A.t + 2, w: w - 4 };
  }

  function cityscan({ g, t, e, A }) {
    const mw = Math.round(A.w * 0.66);
    const P = cityMap(g, A, t, mw, A.h), [bx, by] = P.agency, ang = t * 1.6;
    for (let r = 1; r < mw; r += 0.5) for (let da = 0; da < 0.5; da += 0.04) {
      const a = ang - da, x = bx + Math.cos(a) * r, y = by + Math.sin(a) * r * 0.5;
      if (x < A.l || x >= A.l + mw || y < A.t || y > A.b) continue;
      const [ch] = g.get(Math.round(x), Math.round(y));
      if (ch && ch !== ' ') g.set(x, y, ch, da < 0.08 ? ST.CB : ST.C);
    }
    MV.pixelArt(g, bx - 3, by - 3, 'bonnie', { cols: 6, t });
    const p = sidePanel(g, A, mw, 'UNION CITY · GRID SCAN');
    ['SECTOR 01', '中城大学', 'CLOCK TOWER', 'SOUTH HARBOR', 'MARKET', 'OLD TOWN', 'SEWERS', 'OBSERVATORY'].forEach((q, i) => {
      const le = e - 0.6 - i * 1.25;
      if (le < 0) return;
      g.put(p.x, p.y + i * 2, typed('search(you) @ ' + q, le, 40), ST.N);
      if (le > 0.8) g.put(p.x + p.w - 3, p.y + i * 2, '0', ST.R);
    });
    g.put(p.x, A.b - 2, 'RESULTS: 0', blink(t, 1) ? ST.R : ST.D);
  }

  function marks({ g, t, e, d, u, A }) {
    const mw = Math.round(A.w * 0.66);
    const P = cityMap(g, A, t, mw, A.h);
    MV.pixelArt(g, P.agency[0] - 3, P.agency[1] - 3, 'bonnie', { cols: 6, t });
    const clues = [['tower', 'magnifier', 'MAGNIFIER 放大镜'], ['uni', 'camera', 'CAMERA 相机'], ['harbor', 'cake', 'STRAWBERRY CAKE 草莓蛋糕']];
    const p = sidePanel(g, A, mw, 'COVERT ACTION 隐匿行动', ST.BO);
    let shown = 0;
    clues.forEach(([k], i) => {
      const at = 0.08 + i * 0.3;
      if (u < at) return;
      shown = i + 1;
      const [mx, my] = P[k], r = ((u - at) * d * 6) % 6;
      for (let a = 0; a < 6.3; a += 0.25) g.set(mx + Math.cos(a) * r * 2, my + Math.sin(a) * r, 'o', r < 3 ? ST.BOL : ST.BO);
      g.put(mx, my, '@', ST.BOL);
    });
    if (shown) {
      const [, spr, name] = clues[shown - 1];
      g.put(p.x, p.y, `CLUE ${shown}/3`, ST.BOL);
      g.put(p.x, p.y + 2, name, ST.W);
      const sz = MV.spriteSize(spr);
      MV.sprite(g, Math.round(p.x + p.w / 2 - sz.w / 2), p.y + 5, spr, { t });
      g.put(p.x, A.b - 3, `MARKED: ${shown}/3`, ST.BO);
      g.put(p.x, A.b - 2, 'KNOCK DOWN -> SECRET INQUIRY', ST.D);
    }
  }

  function trail({ g, t, u, A }) {
    const mw = Math.round(A.w * 0.66);
    const P = cityMap(g, A, t, mw, A.h), path = [P.agency, P.tower, P.uni, P.harbor, P.impact];
    const lens = []; let total = 0;
    for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], (path[i][1] - path[i - 1][1]) * 2); lens.push(l); total += l; }
    const reach = easeOut(seg(u, 0.05, 0.8)) * total;
    let acc = 0;
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1], [bx, by] = path[i];
      for (let s = 0; s < lens[i - 1]; s += 2) {
        if (acc + s > reach) break;
        const k = s / lens[i - 1], side = (Math.floor(s / 2) % 2) ? 0 : 1;
        g.set(ax + (bx - ax) * k, ay + (by - ay) * k - side * 0.5, '.', acc + s > reach - 12 ? ST.BOL : ST.BO);
      }
      acc += lens[i - 1];
    }
    const [ix, iy] = P.impact;
    if (u > 0.6) {
      for (let r = 1; r < 5; r++) for (let a = 0; a < 6.3; a += 0.3) g.set(ix + Math.cos(a) * r * 2, iy + Math.sin(a) * r, '*#%:.'[r], r < 2 ? ST.Y : ST.B);
      MV.pixelArt(g, ix - 3, iy - 7, 'fanny', { cols: 6, t, corrupt: 0.5, dissolve: 0.3 });
    }
    const p = sidePanel(g, A, mw, 'TRACE');
    g.put(p.x, p.y, 'FOOTPRINT MATCH : 007', ST.P);
    g.put(p.x, p.y + 2, 'DISTANCE  ' + (reach / total * 7.4).toFixed(2) + ' km', ST.N);
    if (u > 0.8) { g.put(p.x, p.y + 6, 'RESULT', ST.D); g.put(p.x, p.y + 8, blink(t, 2) ? '1 PARTIAL MATCH' : '', ST.Y); g.put(p.x, p.y + 10, '-> IMPACT ZONE 天王落', ST.W); }
  }

  // ---------------- Chapter 4 · CCFL LCD ----------------
  function stars(g, A, t, density = 0.03) {
    for (let y = A.t; y <= A.b; y++) for (let x = A.l; x <= A.r; x++) {
      const h = rnd(x * 7919 + y * 104729);
      if (h < density) g.set(x, y, h < density * 0.15 ? '*' : (rnd(h * 1e5 + Math.floor(t * 3)) < 0.8 ? '.' : '+'), h < density * 0.15 ? ST.W : ST.D);
    }
  }
  function skyline(g, A, h0) {
    for (let x = A.l; x <= A.r; x++) {
      const b = Math.floor(x / 4), h = 2 + (hash16(b * 31) % h0);
      for (let y = A.b - h; y <= A.b; y++) {
        const win = x % 4 === 1 && (y + b) % 3 === 0;
        g.set(x, y, win && hash16(x * y) % 3 ? '.' : '#', win ? ST.Y : ST.K);
      }
    }
  }
  function starfall({ g, t, e, d, u, A, fx, shot }) {
    const ui = (shot.p.impact - (t - e)) / d; // impact lands on its bar line
    stars(g, A, t);
    skyline(g, A, Math.round(A.h * 0.25));
    g.put(A.l + 1, A.t, 'LOG 23:59:57 — STARFALL DETECTED · SECTOR 09', ST.Y);
    const sx = A.r - 4, sy = A.t, ex = A.cx + 8, ey = A.b - Math.round(A.h * 0.2);
    const k = easeIn(seg(u, 0.08, ui - 0.01));
    if (u < ui) {
      const ramp = '@%#*+=-:. ';
      for (let i = 0; i < 40; i++) {
        const kk = k - i * 0.012; if (kk < 0) break;
        g.set(mix(sx, ex, kk) + (rnd(i + Math.floor(t * 30)) - 0.5) * 2 * (i / 40), mix(sy, ey, kk), ramp[Math.min(9, Math.floor(i / 4))], i < 6 ? ST.W : i < 16 ? ST.Y : ST.B);
      }
      MV.sphere(g, mix(sx, ex, k), mix(sy, ey, k), 2, 1.2, t * 5, ST.W, ' .*#@');
    } else {
      const v = (u - ui) / (1 - ui);
      fx.flash = Math.max(0, 1 - v * 5); fx.shake = Math.max(0, 1.5 - v * 3);
      for (let ring = 0; ring < 3; ring++) {
        const r = v * 60 - ring * 8;
        if (r <= 0) continue;
        for (let a = 0; a < 6.3; a += 0.02) g.set(ex + Math.cos(a) * r * 2, ey + Math.sin(a) * r * 0.6, '~=-.'[ring + (r > 30 ? 1 : 0)], ring ? ST.B : ST.W);
      }
      if (v > 0.25) {
        const bm = MV.blockText([['THE FALL', 2, 2]], 0);
        g.stamp(bm, Math.round(A.cx - bm.w / 2), A.t + 4, (x, y, ix, iy) => g.set(x, y, '01'[hash16(ix * 13 + iy * 7 + Math.floor(t * 4)) % 2], ST.W));
        g.center(A.t + 4 + bm.h + 1, '天 王 落', ST.B);
      }
      // The lyric's candidate card previews the flower before impact; after the
      // bar-aligned impact the flower rises promptly, stem first.
      const k = easeOut(seg(v, 0.12, 0.5));
      if (k > 0) {
        const sz = MV.spriteSize('flower'), fy = Math.round(ey + 1 - sz.h * k), keep = g.clip;
        g.clip = [0, 0, g.w - 1, ey];
        MV.sprite(g, Math.round(ex - sz.w / 2), fy, 'flower', { t });
        g.clip = keep;
      }
    }
  }

  function lastphoto({ g, t, u, A }) {
    const w = Math.round(A.w * 0.62), h = A.h - 2, x = Math.round(A.cx - w / 2), y = A.t + 1;
    const scanY = Math.floor(mix(0, h - 2, seg(u, 0.05, 0.85)));
    g.box(x, y, w, h, ST.N, 'IMG_0217.RAW');
    g.put(x + w - 26, y, ` RECOVERING ${String(Math.round(seg(u, 0.05, 0.85) * 100)).padStart(3)}% `, ST.W);
    const I = { l: x + 1, t: y + 1, r: x + w - 2, b: y + h - 2 };
    for (let yy = I.t; yy <= I.b; yy++) for (let xx = I.l; xx <= I.r; xx++) {
      if (yy - I.t > scanY) { if (rnd(xx * 31 + yy * 17 + Math.floor(t * 15)) < 0.12) g.set(xx, yy, '#', ST.G); continue; }
      if (rnd(xx * 7919 + yy * 104729) < 0.03) g.set(xx, yy, '.', ST.D);
      if (yy === I.b - 3) g.set(xx, yy, '_', ST.D);
    }
    const sx = Math.round(I.l + (I.r - I.l) * 0.72), sy = I.t + 2;
    for (let i = 0; i < 14; i++) if (i <= scanY) g.set(sx - i * 2, sy + i * 0.5, i ? '*+=-:.'[Math.min(5, i >> 1)] : '@', i < 3 ? ST.W : ST.Y);
    const rev = clamp((scanY - (I.b - I.t - 20)) / 20);
    if (MV.hasPortrait('F02_fanny_lastphoto')) MV.portrait(g, Math.round(A.cx - 4), I.b + 1, 'F02_fanny_lastphoto', { t, reveal: rev, noFrame: true });
    else avatar(g, 'fanny', A.cx - 4, I.b - 2, 16, { t, mode: 'data', reveal: rev });
    if (scanY < h - 2) for (let xx = I.l; xx <= I.r; xx++) g.set(xx, I.t + scanY + 1, '=', ST.CB);
    g.put(x, y + h, 'LAST PHOTO · 23:59:58 · CAMERA 007', ST.D);
  }

  function signallost({ g, t, e, d, u, A, fx, shot }) {
    const flat = shot.p.flat - (t - e); // the trace dies on this bar
    const M = rails(g, A, t, 'VITALS / 007', 'EVENTS', { ops: ['BEAT', 'BEAT', 'WEAK', 'BEAT', 'NULL', 'LOST'], speed: u > 0.55 ? 2 : 10 });
    [['23:59:57', 'STARFALL DETECTED · SECTOR 09', ST.Y], ['23:59:58', 'CAMERA 007 · SHUTTER', ST.N], ['23:59:58', 'MAGIC FIELD ##### OVERFLOW', ST.R],
     ['23:59:59', 'AGENT 007 VITALS ... WEAK', ST.P], ['00:00:00', 'AGENT 007 VITALS ... --', ST.R], ['00:00:00', 'CONNECTION TERMINATED', ST.R]]
      .forEach(([ts, s, st], i) => { const le = e - i * 0.9; if (le > 0) { g.put(M.l, M.t + 1 + i * 2, ts, ST.D); g.put(M.l + 10, M.t + 1 + i * 2, typed(s, le, 34), st); } });
    const ph = 10, py = M.t + 14, mid = py + 5;
    g.box(M.l, py, M.w, ph, ST.P, 'ECG · 007');
    for (let x = 1; x < M.w - 1; x++) {
      const tt = t - (M.w - x) * 0.02;
      const amp = 1 - clamp((tt - (t - e) - flat) / 1.2);
      g.set(M.l + x, mid - Math.round(MV.ecg(tt * 1.4) * amp * 3.5), x > M.w - 4 ? '@' : '*', amp < 0.02 ? ST.R : ST.PB);
    }
    if (e > flat + 0.6) { fx.tear = 0.4; if (blink(t, 2)) g.big(M.b - 5, 'SIGNAL LOST', ST.R, 1, 1, '#', (M.l + M.r) / 2); }
  }

  MV.SCENES = { boot, casefile, query, bonnie, fanny, rivals, cityscan, marks, trail, starfall, lastphoto, signallost };
})();
