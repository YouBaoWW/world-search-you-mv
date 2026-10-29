/* Pixel avatars (the 20x20 head-shots from the 吉星派对 wiki) on the character grid.
   One cell holds two source pixels stacked: '▀' in the upper colour over a cell
   background in the lower colour, so pixels stay square on 10x16 cells. */
(function () {
  const MV = window.MV, ST = MV.ST;

  MV.PIXELS = {};
  MV.loadPixelArt = function (base) {
    const list = { bonnie: 'bonnie_px20.png', fanny: 'fanny_px20.png' };
    return Promise.all(Object.entries(list).map(([name, file]) => new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, img.width, img.height).data, px = [];
        for (let i = 0; i < img.width * img.height; i++)
          px.push(d[i * 4 + 3] < 128 ? -1 : (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2]);
        MV.PIXELS[name] = { w: img.width, h: img.height, px };
        res();
      };
      img.onerror = () => res();
      img.src = base + file;
    })));
  };

  const lum = (c) => (0.2126 * ((c >> 16) & 255) + 0.7152 * ((c >> 8) & 255) + 0.0722 * (c & 255)) / 255;

  /* Draw pixel avatar `name` with its top-left cell at (x0, y0), `cols` cells wide.
     opt.mode: 'block' (solid pixels) | 'data' (each cell a 0/1/# glyph in the pixel colour,
     the reference project's data-filled look) | 'mix' (data that settles into blocks by opt.settle)
     opt.reveal 0..1 top-down, opt.corrupt 0..1, opt.dissolve 0..1, opt.flip, opt.t, opt.tint (style) */
  MV.pixelArt = function (g, x0, y0, name, opt = {}) {
    const P = MV.PIXELS[name];
    if (!P) return;
    const cols = opt.cols || 40;
    // Square pixels: a cell is CW x CH, so two stacked half-cells per CH.
    const halfRows = Math.round((cols * MV.CW) / (MV.CH / 2) * (P.h / P.w));
    const rows = Math.ceil(halfRows / 2), t = opt.t || 0, f = Math.floor(t * 15);
    const at = (cx, hy) => {
      if (hy >= halfRows) return -1;
      let sx = Math.floor((cx / cols) * P.w), sy = Math.floor((hy / halfRows) * P.h);
      if (opt.flip) sx = P.w - 1 - sx;
      return P.px[sy * P.w + sx];
    };
    for (let r = 0; r < rows; r++) {
      if (opt.reveal !== undefined && r >= opt.reveal * rows) break;
      for (let c = 0; c < cols; c++) {
        let top = at(c, r * 2), bot = at(c, r * 2 + 1);
        if (top < 0 && bot < 0) continue;
        // The sprites' black outline would vanish on a black screen: lift it to a dark keyline.
        const key = opt.keyline ?? 0x4a4058;
        if (top >= 0 && lum(top) < 0.08) top = key;
        if (bot >= 0 && lum(bot) < 0.08) bot = key;
        const id = c * 131 + r * 977 + (opt.seed || 0);
        if (opt.dissolve && MV.rnd(id) < opt.dissolve) continue;
        if (opt.corrupt && MV.rnd(id + f * 11) < opt.corrupt) { g.set(x0 + c, y0 + r, '#%?@&$01'[MV.hash16(id + f) % 8], ST.D); continue; }
        const mode = opt.mode === 'mix' ? (MV.rnd(id * 3) < (opt.settle ?? 1) ? 'block' : 'data') : opt.mode || 'block';
        if (opt.tint !== undefined) {
          g.set(x0 + c, y0 + r, mode === 'data' ? '01#'[MV.hash16(id + f) % 3] : '█', opt.tint);
          continue;
        }
        if (mode === 'data') {
          const col = top >= 0 ? top : bot, L = lum(col);
          const ch = L < 0.12 ? '#' : '01'[MV.hash16(id + Math.floor(t * 6)) % 2];
          g.set(x0 + c, y0 + r, ch, ST.W, L < 0.12 ? 0x3a3a46 : col);
        } else if (top >= 0 && bot >= 0) g.set(x0 + c, y0 + r, '▀', ST.W, top, bot);
        else if (top >= 0) g.set(x0 + c, y0 + r, '▀', ST.W, top);
        else g.set(x0 + c, y0 + r, '▄', ST.W, bot);
      }
    }
    return { cols, rows };
  };
  MV.pixelArtRows = (cols) => Math.ceil(Math.round((cols * MV.CW) / (MV.CH / 2)) / 2);
})();
