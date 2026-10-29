/* Portrait slots. Drop assets/portraits/<id>.png (transparent PNG, or a pure
   #00FF00 background) and the slot switches from the ASCII placeholder to an
   image converted into coloured characters. The prompt pack in
   prompts/ describes exactly what to generate for every id. */
(function () {
  const MV = window.MV, ST = MV.ST;

  // cols x rows is the on-screen box (cells are 10x16 px at 128 cols, so a
  // 2:3 portrait image fills roughly 30 x 28 cells).
  MV.SLOTS = {
    // facing = which way the generated image looks; scenes ask for a facing and
    // only the ASCII fallback is ever mirrored, never the artwork.
    B01_bonnie_profile:   { fallback: 'bonnie',    cols: 30, rows: 28, facing: 'right', shots: 'S04 S06 S14' },
    B02_bonnie_terminal:  { fallback: 'bonnie',    cols: 26, rows: 24, facing: 'left',  shots: 'S03' },
    B03_bonnie_throw:     { fallback: 'bonnie',    cols: 30, rows: 28, facing: 'right', shots: 'S15' },
    B04_bonnie_reach:     { fallback: 'bonnie',    cols: 30, rows: 28, facing: 'right', shots: 'S19' },
    B05_bonnie_magnifier: { fallback: 'bonnie',    cols: 30, rows: 28, facing: 'right', shots: 'S20' },
    F01_fanny_dossier:    { fallback: 'fanny',     cols: 30, rows: 28, facing: 'front', shots: 'S05 S06' },
    F02_fanny_lastphoto:  { fallback: 'fanny',     cols: 34, rows: 26, facing: 'back',  shots: 'S11' },
    F03_fanny_echo:       { fallback: 'fanny',     cols: 30, rows: 28, facing: 'left',  shots: 'S13 S14 S18' },
    F04_fanny_reach:      { fallback: 'fanny',     cols: 30, rows: 28, facing: 'left',  shots: 'S19' },
    F05_fanny_chibi:      { fallback: 'fannyMini', cols: 8,  rows: 4,  shots: 'S17 S18' },
    P01_magnifier:        { fallback: 'magnifier', cols: 14, rows: 9,  shots: 'S08 S19 S20' },
    P02_camera:           { fallback: 'camera',    cols: 16, rows: 8,  shots: 'S08' },
    P03_strawberry_cake:  { fallback: 'cake',      cols: 14, rows: 9,  shots: 'S08 S20' },
    P04_poison_apple:     { fallback: 'apple',     cols: 10, rows: 6,  shots: 'S04 S15' },
  };

  MV.images = {};
  MV.loadPortraits = function (base = 'assets/portraits/', exists = () => true) {
    return Promise.all(Object.keys(MV.SLOTS).filter((id) => exists(id + '.png')).map((id) => new Promise((res) => {
      const img = new Image();
      img.onload = () => { MV.images[id] = img; res(); };
      img.onerror = () => res();
      img.src = base + id + '.png';
    })));
  };

  const RAMP = " .'`,:;-~=+*xo#%&@";
  const SAMPLES = new Map();
  function sample(id, cols, rows) {
    const key = id + cols + 'x' + rows;
    if (SAMPLES.has(key)) return SAMPLES.get(key);
    const img = MV.images[id], cv = document.createElement('canvas');
    // Fit image into a cols*10 x rows*16 box (cell aspect), anchored bottom-centre.
    const bw = cols * MV.CW, bh = rows * MV.CH, s = Math.min(bw / img.width, bh / img.height);
    const dw = img.width * s, dh = img.height * s;
    cv.width = cols; cv.height = rows;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, ((bw - dw) / 2) / MV.CW, (bh - dh) / MV.CH, dw / MV.CW, dh / MV.CH);
    const d = x.getImageData(0, 0, cols, rows).data, cells = [];
    for (let i = 0; i < cols * rows; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
      const key = g > 200 && r < 90 && b < 90; // chroma green
      if (a < 90 || key) { cells.push(null); continue; }
      const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const ch = RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(Math.pow(L, 0.8) * (RAMP.length - 1))))];
      // Lift colour so dark linework still reads on a black screen.
      const k = 0.35 + 0.65 * L, lift = (v) => Math.min(255, Math.round(v * (0.55 + k) + 18));
      cells.push([ch, (lift(r) << 16) | (lift(g) << 8) | lift(b), L]);
    }
    const out = { cols, rows, cells };
    SAMPLES.set(key, out);
    return out;
  }

  MV.hasPortrait = (id) => !!MV.images[id];

  /* Draw slot `id` with its box's bottom-centre at (cx, by).
     opt: same as MV.sprite (flip, ghost, reveal, dissolve, corrupt, tint, t) + scale. */
  MV.portrait = function (g, cx, by, id, opt = {}) {
    const slot = MV.SLOTS[id];
    // Slot sizes are authored for the 45-row grid; older displays have fewer rows.
    const k = (opt.scale || 1) * g.h / 45;
    const cols = Math.round(slot.cols * k * (g.w / g.h) / (128 / 45)), rows = Math.round(slot.rows * k);
    const x0 = Math.round(cx - cols / 2), y0 = Math.round(by - rows);
    if (MV.showSlots) { g.box(x0, y0, cols, rows, ST.G); g.put(x0 + 1, y0, id, ST.C); }
    if (!MV.images[id]) {
      // Placeholder: dotted corner marks + slot id, ASCII stand-in inside.
      if (cols > 12 && !opt.noFrame) {
        for (const [cx2, cy2, a, b] of [[x0, y0, '+', '-'], [x0 + cols - 1, y0, '+', '-'], [x0, y0 + rows - 1, '+', '-'], [x0 + cols - 1, y0 + rows - 1, '+', '-']]) {
          g.set(cx2, cy2, a, ST.G);
          g.set(cx2 + (cx2 === x0 ? 1 : -1), cy2, b, ST.G); g.set(cx2, cy2 + (cy2 === y0 ? 1 : -1), ':', ST.G);
        }
        g.put(x0 + 2, y0, id.slice(0, cols - 4), ST.G);
      }
      const sz = MV.spriteSize(slot.fallback);
      MV.sprite(g, Math.round(cx - sz.w / 2), Math.round(by - sz.h), slot.fallback, opt);
      return;
    }
    const s = sample(id, cols, rows), t = opt.t || 0, f = Math.floor(t * 20), reveal = opt.reveal ?? 1;
    opt = { ...opt, flip: false };
    for (let y = 0; y < rows; y++) {
      if (y >= reveal * rows) break;
      for (let x = 0; x < cols; x++) {
        const c = s.cells[y * cols + (opt.flip ? cols - 1 - x : x)];
        if (!c) continue;
        let [ch, rgb] = c, st = ST.W;
        const id2 = x * 131 + y * 977 + (opt.seed || 0);
        if (opt.dissolve && MV.rnd(id2) < opt.dissolve) continue;
        if (opt.ghost) {
          if (MV.rnd(id2 + f * 3) < opt.ghost * 0.45) continue;
          ch = c[2] > 0.5 ? ':' : '.'; rgb = -1; st = MV.rnd(id2 + f * 7) < 0.15 ? ST.PB : opt.ghostStyle ?? ST.G;
        }
        if (opt.tint !== undefined) { rgb = -1; st = opt.tint; }
        if (opt.corrupt && MV.rnd(id2 + f * 11) < opt.corrupt) { ch = '#%?@&$'[MV.hash16(id2 + f) % 6]; rgb = -1; st = ST.D; }
        g.set(x0 + x, y0 + y, ch, st, rgb);
      }
    }
  };
})();
