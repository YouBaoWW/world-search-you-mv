/* Display hardware evolution: antique CRT -> modern OLED.
   Each era changes grid resolution, palette response, glass curvature,
   scanlines / aperture grille / LCD sub-pixels, backlight bleed and bezel.
   The schedule (which era when) lives in timeline.js as MV.ERA_SCHEDULE. */
(function () {
  const MV = window.MV, clamp = MV.clamp, mix = MV.mix;

  // ASCII-layer eras (chapters 1-4). lcd-ips / oled are drawn by the React layer
  // (src/modern), they are listed here only so labels and schedule share one table.
  MV.ERAS = [
    { id: 'crt-amber', label: '1983 · P3 AMBER MONOCHROME CRT', cols: 120, rows: 40, font: 'retro',
      mono: [255, 176, 72], bg: [10, 6, 2], curve: 0.10, inset: 0.07, radius: 56,
      scan: 0.3, grille: 0, lcd: 0, bleed: 0, bloom: 1.3, flicker: 0.05, bezel: 'crt', glass: 0.07, vignette: 0.45 },
    { id: 'crt-ega', label: '1987 · EGA 16-COLOUR CRT', cols: 120, rows: 40, font: 'retro', ega: true,
      bg: [0, 0, 0], curve: 0.08, inset: 0.06, radius: 46,
      scan: 0.28, grille: 0.12, lcd: 0, bleed: 0, bloom: 1.1, flicker: 0.035, bezel: 'crt', glass: 0.06, vignette: 0.4 },
    { id: 'crt-color', label: '1994 · TRINITRON COLOUR CRT', cols: 128, rows: 45,
      bg: [6, 7, 10], curve: 0.05, inset: 0.045, radius: 30, sat: 0.92,
      scan: 0.22, grille: 0.22, lcd: 0, bleed: 0, bloom: 1.0, flicker: 0.02, bezel: 'crt', glass: 0.05, vignette: 0.4 },
    { id: 'lcd-ccfl', label: '2004 · CCFL TFT-LCD', cols: 128, rows: 45,
      bg: [20, 22, 27], lift: 0.07, sat: 0.75, curve: 0, inset: 0.03, radius: 6,
      scan: 0, grille: 0, lcd: 0.3, bleed: 0.55, bloom: 0.4, flicker: 0, bezel: 'lcd', glass: 0.02, vignette: 0.25 },
    { id: 'lcd-ips', label: '2013 · LED IPS LCD', modern: true },
    { id: 'oled', label: '2026 · OLED · TRUE BLACK', modern: true },
  ];

  const EGA = [0x000000, 0x0000aa, 0x00aa00, 0x00aaaa, 0xaa0000, 0xaa00aa, 0xaa5500, 0xaaaaaa,
    0x555555, 0x5555ff, 0x55ff55, 0x55ffff, 0xff5555, 0xff55ff, 0xffff55, 0xffffff].map((c) => [c >> 16, (c >> 8) & 255, c & 255]);

  // Era at time t plus the active hardware transition, if any.
  MV.eraAt = function (t) {
    const S = MV.ERA_SCHEDULE;
    let k = 0;
    for (let i = 0; i < S.length; i++) if (t >= S[i].at) k = i;
    let trans = null;
    for (let i = 1; i < S.length; i++) {
      const d = S[i].dur || 1.2, a = S[i].at - d / 2;
      if (t >= a && t < a + d) trans = { kind: S[i].kind, u: (t - a) / d, from: S[i - 1].era, to: S[i].era };
    }
    // During the first half of a transition the old hardware is still on screen.
    const id = trans && trans.u < 0.5 ? trans.from : S[k].era;
    return { era: MV.ERAS.find((e) => e.id === id), trans };
  };

  // ---------- colour response ----------
  const hex2 = (n) => n.toString(16).padStart(2, '0');
  const PAL_RGB = MV.PALETTE.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const CACHE = new Map();
  MV.eraColor = function (era, r, g, b) {
    const key = era.id + ((r << 16) | (g << 8) | b);
    let c = CACHE.get(key);
    if (c) return c;
    const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    let o;
    if (era.ega) {
      let best = 0, bd = 1e9;
      EGA.forEach((e, i) => { const d = (e[0] - r) ** 2 * 0.3 + (e[1] - g) ** 2 * 0.59 + (e[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } });
      o = EGA[best];
    } else if (era.mono) {
      const k = 0.18 + 0.82 * Math.pow(L, 0.7);
      o = era.mono.map((m) => m * k);
    } else {
      const s = era.sat ?? 1, gray = L * 255;
      o = [r, g, b].map((v) => clamp(gray + (v - gray) * s, 0, 255));
      if (era.lift) o = o.map((v) => era.lift * 255 + v * (1 - era.lift));
    }
    c = '#' + o.map((v) => hex2(Math.round(clamp(v, 0, 255)))).join('');
    CACHE.set(key, c);
    return c;
  };
  const styleColor = (era, s) => { const p = PAL_RGB[s]; return MV.eraColor(era, p[0], p[1], p[2]); };
  const bgColor = (era) => '#' + era.bg.map(hex2).join('');

  // ---------- canvases ----------
  let cv, ctx, scr, sctx, tmp, tctx, glow, gctx, scale = 1;
  const overlays = new Map();
  MV.setup = function (canvas, s = 1) {
    cv = canvas; scale = s;
    cv.width = 1280 * s; cv.height = 720 * s;
    overlays.clear();
    ctx = cv.getContext('2d');
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    scr = mk(cv.width, cv.height); sctx = scr.getContext('2d');
    tmp = mk(cv.width, cv.height); tctx = tmp.getContext('2d');
    glow = mk(cv.width / 2, cv.height / 2); gctx = glow.getContext('2d');
  };

  // Static per-era overlay (scanlines, grille, sub-pixels, bleed) cached once.
  function overlay(era) {
    if (overlays.has(era.id)) return overlays.get(era.id);
    const W = cv.width, H = cv.height, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    if (era.scan) {
      x.fillStyle = `rgba(0,0,0,${era.scan})`;
      const pitch = (H / era.rows) / 4;
      for (let y = 0; y < H; y += pitch * 2) x.fillRect(0, y, W, pitch);
    }
    if (era.grille) {
      const cols = ['rgba(255,40,40,', 'rgba(40,255,40,', 'rgba(60,60,255,'];
      for (let xx = 0, i = 0; xx < W; xx += scale, i++) { x.fillStyle = cols[i % 3] + era.grille * 0.35 + ')'; x.fillRect(xx, 0, scale, H); }
      x.fillStyle = `rgba(0,0,0,${era.grille * 0.5})`;
      for (let xx = 0; xx < W; xx += 3 * scale) x.fillRect(xx, 0, scale * 0.5, H);
    }
    if (era.lcd) {
      x.fillStyle = `rgba(0,0,0,${era.lcd})`;
      const p = 3 * scale;
      for (let xx = 0; xx < W; xx += p) x.fillRect(xx, 0, scale * 0.6, H);
      for (let y = 0; y < H; y += p) x.fillRect(0, y, W, scale * 0.6);
    }
    if (era.bleed) {
      // Uneven CCFL / edge-lit backlight: bright blooms leaking from edges and corners.
      const spots = [[0.02, 0.05, 0.3], [0.98, 0.04, 0.26], [0.03, 0.97, 0.24], [0.97, 0.95, 0.3], [0.5, 1.0, 0.35]];
      for (const [sx, sy, r] of spots) {
        const gr = x.createRadialGradient(sx * W, sy * H, 0, sx * W, sy * H, r * W);
        gr.addColorStop(0, `rgba(150,160,190,${0.14 * era.bleed})`); gr.addColorStop(1, 'rgba(150,160,190,0)');
        x.fillStyle = gr; x.fillRect(0, 0, W, H);
      }
    }
    if (era.vignette) {
      const gr = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${era.vignette})`);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
    }
    overlays.set(era.id, c);
    return c;
  }

  // Draw the character grid onto the flat "signal" canvas.
  function drawGrid(g, era, fx, t) {
    const W = scr.width, H = scr.height, cwp = W / g.w, chp = H / g.h;
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 1; sctx.filter = 'none';
    sctx.fillStyle = bgColor(era); sctx.fillRect(0, 0, W, H);
    const shx = fx.shake ? (MV.rnd(Math.floor(t * 60)) - 0.5) * fx.shake * cwp : 0;
    const shy = fx.shake ? (MV.rnd(Math.floor(t * 60) + 7) - 0.5) * fx.shake * chp * 0.5 : 0;
    sctx.textBaseline = 'middle';
    const retro = era.font === 'retro';
    const fs = Math.round(chp * (retro ? 1.08 : 0.86));
    const mono = `${fs}px ${retro ? MV.FONT_RETRO : MV.FONT_MONO}`, cjk = `${Math.round(chp * 0.82)}px ${MV.FONT_CJK}`;
    // Cell backgrounds first (half-block pixel art paints its lower pixel here).
    for (let i = 0; i < g.bg.length; i++) {
      const b = g.bg[i];
      if (b < 0) continue;
      sctx.fillStyle = MV.eraColor(era, (b >> 16) & 255, (b >> 8) & 255, b & 255);
      sctx.fillRect((i % g.w) * cwp + shx, Math.floor(i / g.w) * chp + shy, cwp + 0.6, chp + 0.6);
    }
    // Glyphs are scaled horizontally so every era keeps a true cell grid.
    sctx.font = mono;
    const sx = cwp / sctx.measureText('M').width;
    let last = '', lastFont = mono;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x, c = g.ch[i];
      if (c === ' ' || c === '') continue;
      const rgb = g.rgb[i];
      const col = rgb >= 0 ? MV.eraColor(era, (rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255) : styleColor(era, g.st[i]);
      if (col !== last) { sctx.fillStyle = col; last = col; }
      const px = x * cwp + shx, py = y * chp + shy;
      if (c === '█') { sctx.fillRect(px, py, cwp + 0.5, chp + 0.5); continue; }
      if (c === '▀') { sctx.fillRect(px, py, cwp + 0.5, chp / 2 + 0.5); continue; }
      if (c === '▄') { sctx.fillRect(px, py + chp / 2, cwp + 0.5, chp / 2 + 0.5); continue; }
      const wide = MV.cw(c) === 2, f = wide ? cjk : mono;
      if (f !== lastFont) { sctx.font = f; lastFont = f; }
      if (wide) sctx.fillText(c, px, py + chp * 0.55, cwp * 2);
      else { sctx.save(); sctx.translate(px, py + chp * 0.55); sctx.scale(Math.min(sx, 1.6), 1); sctx.fillText(c, 0, 0); sctx.restore(); }
    }
    // Bloom.
    gctx.clearRect(0, 0, glow.width, glow.height);
    gctx.filter = `blur(${(era.mono ? 4 : 3) * scale}px)`;
    gctx.drawImage(scr, 0, 0, glow.width, glow.height);
    gctx.filter = 'none';
    sctx.globalCompositeOperation = 'lighter';
    sctx.globalAlpha = clamp(0.5 * era.bloom * (fx.bloom ?? 1), 0, 1.2);
    sctx.drawImage(glow, 0, 0, W, H);
    sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over';
    // Signal damage.
    if (fx.tear > 0) {
      const n = Math.floor(fx.tear * 9), f = Math.floor(t * 30);
      for (let k = 0; k < n; k++) {
        if (MV.rnd(f * 13 + k) > fx.tear) continue;
        const y = MV.rnd(f * 7 + k) * H, h = (4 + MV.rnd(f + k * 3) * 30) * scale, dx = (MV.rnd(f * 5 + k) - 0.5) * 90 * scale * fx.tear;
        sctx.drawImage(scr, 0, y, W, h, dx, y, W, h);
      }
    }
    if (fx.rgb > 0 && !era.mono) {
      sctx.globalCompositeOperation = 'lighter'; sctx.globalAlpha = 0.3 * fx.rgb;
      sctx.drawImage(scr, fx.rgb * 5 * scale, 0);
      sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over';
    }
    if (fx.flash > 0) { sctx.fillStyle = fx.flashColor || styleColor(era, MV.ST.W); sctx.globalAlpha = clamp(fx.flash); sctx.fillRect(0, 0, W, H); sctx.globalAlpha = 1; }
    sctx.drawImage(overlay(era), 0, 0);
    // Rolling refresh band on CRTs.
    if (era.flicker) {
      const y = ((t * 0.37) % 1.3 - 0.15) * H;
      const gr = sctx.createLinearGradient(0, y - H * 0.12, 0, y + H * 0.12);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${era.flicker * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      sctx.fillStyle = gr; sctx.fillRect(0, y - H * 0.12, W, H * 0.24);
      sctx.fillStyle = `rgba(0,0,0,${era.flicker * MV.rnd(Math.floor(t * 50))})`; sctx.fillRect(0, 0, W, H);
    }
  }

  // Barrel-ish CRT glass: two strip passes squeeze edges toward the centre.
  function warp(dst, rect, k, wobble, t) {
    const W = scr.width, H = scr.height, [rx, ry, rw, rh] = rect;
    if (k <= 0 && !wobble) { dst.drawImage(scr, rx, ry, rw, rh); return; }
    tctx.clearRect(0, 0, W, H);
    const step = 2 * scale;
    for (let y = 0; y < H; y += step) {
      const ny = (y / H) * 2 - 1, f = 1 - k * ny * ny, dw = W * f;
      const wob = wobble ? Math.sin(y * 0.03 / scale + t * 40) * wobble * 30 * scale : 0;
      tctx.drawImage(scr, 0, y, W, step, (W - dw) / 2 + wob, y, dw, step);
    }
    for (let x = 0; x < W; x += step) {
      const nx = (x / W) * 2 - 1, f = 1 - k * 0.8 * nx * nx, dh = rh * f;
      dst.drawImage(tmp, x, 0, step, H, rx + (x * rw) / W, ry + (rh - dh) / 2, (step * rw) / W + 0.6, dh);
    }
  }

  function bezel(era, rect, t) {
    const W = cv.width, H = cv.height, [rx, ry, rw, rh] = rect;
    if (era.bezel === 'none') return;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H);
    ctx.roundRect(rx, ry, rw, rh, era.radius * scale);
    ctx.clip('evenodd');
    if (era.bezel === 'crt') {
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#2a2723'); gr.addColorStop(0.5, '#1c1a17'); gr.addColorStop(1, '#141210');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      // Recessed inner lip.
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 10 * scale;
      ctx.beginPath(); ctx.roundRect(rx - 5 * scale, ry - 5 * scale, rw + 10 * scale, rh + 10 * scale, (era.radius + 6) * scale); ctx.stroke();
      ctx.fillStyle = '#6b6357'; ctx.font = `${11 * scale}px ${MV.FONT_MONO}`; ctx.textBaseline = 'middle';
      ctx.fillText('GRAYSON-TERM  006', rx + 8 * scale, ry + rh + (H - ry - rh) / 2);
      ctx.fillStyle = MV.rnd(Math.floor(t * 2)) > 0.03 ? '#4dff7a' : '#164d24';
      ctx.beginPath(); ctx.arc(rx + rw - 14 * scale, ry + rh + (H - ry - rh) / 2, 3 * scale, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = era.bezel === 'lcd' ? '#0b0b0d' : '#050506'; ctx.fillRect(0, 0, W, H);
      if (era.bezel === 'lcd') {
        ctx.fillStyle = '#3a3b40'; ctx.font = `${10 * scale}px ${MV.FONT_UI}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText('GRAYSON', W / 2, ry + rh + (H - ry - rh) / 2); ctx.textAlign = 'left';
      }
    }
    ctx.restore();
    if (era.glass) {
      const gr = ctx.createLinearGradient(rx, ry, rx + rw * 0.6, ry + rh * 0.8);
      gr.addColorStop(0, `rgba(255,255,255,${era.glass})`); gr.addColorStop(0.35, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, era.radius * scale); ctx.fill();
    }
  }

  MV.paint = function (g, fx, t, era, trans) {
    const W = cv.width, H = cv.height;
    drawGrid(g, era, fx, t);
    let ix = era.inset * W, iy = era.inset * H * 1.15;
    let rect = [ix, iy * 0.8, W - ix * 2, H - iy * 1.8];
    if (era.bezel === 'none') rect = [0, 0, W, H];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = era.bezel === 'none' ? '#000' : '#000'; ctx.fillRect(0, 0, W, H);
    let k = era.curve, wobble = 0, bright = 0, sq = [1, 1], reveal = 1, shutdown = 0;
    if (trans) {
      const u = trans.u, out = u < 0.5, v = out ? u / 0.5 : (u - 0.5) / 0.5;
      if (trans.kind === 'degauss') { wobble = Math.sin(v * Math.PI) * (out ? 0.6 : 1) * (1 - (out ? 0 : v)); bright = out ? v * 0.12 : (1 - v) * 0.12; }
      if (trans.kind === 'crtOff' && out) { // collapse to a line, then a dot
        sq = [v < 0.6 ? 1 : mix(1, 0.004, MV.easeIn((v - 0.6) / 0.4)), mix(1, 0.006, MV.easeOut(Math.min(1, v / 0.6)))]; bright = v; }
      if (trans.kind === 'crtOff' && !out && trans.to.startsWith('crt')) { sq = [mix(0.004, 1, MV.easeOut(v * 1.6)), v < 0.3 ? 0.006 : mix(0.006, 1, MV.easeOut((v - 0.3) / 0.7))]; bright = 1 - v; }
      if (!out && trans.to.startsWith('lcd') && trans.kind !== 'degauss') reveal = -v; // backlight warm-up
      if (!out && trans.to === 'oled') reveal = v;
      if (trans.kind === 'crtOff' && !out && !trans.to.startsWith('crt')) reveal = -v;
      // The canvas hands over to React at the midpoint. Fade the old monitor
      // to the same black frame that starts the IPS backlight warm-up.
      if (trans.kind === 'backlight' && out) shutdown = MV.smooth(v);
    }
    const [rx, ry, rw, rh] = rect;
    const r2 = [rx + (rw * (1 - sq[0])) / 2, ry + (rh * (1 - sq[1])) / 2, rw * sq[0], rh * sq[1]];
    ctx.save();
    if (era.radius) { ctx.beginPath(); ctx.roundRect(rect[0], rect[1], rect[2], rect[3], era.radius * scale); ctx.clip(); }
    ctx.fillStyle = bgColor(era); ctx.fillRect(rx, ry, rw, rh);
    if (reveal < 0) {
      // LCD warm-up: uniform grey backlight first, image fades in with a stepped flicker.
      const v = -reveal;
      ctx.globalAlpha = clamp(v * 1.4 - 0.2) * (MV.rnd(Math.floor(t * 24)) > 0.25 || v > 0.6 ? 1 : 0.5);
      warp(ctx, r2, k, wobble, t);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(120,128,150,${0.25 * (1 - v)})`; ctx.fillRect(rx, ry, rw, rh);
    } else if (reveal < 1) {
      // OLED wake: self-emissive pixels light up independently from true black.
      warp(ctx, r2, k, wobble, t);
      const n = 40, cw = rw / n, chh = rh / Math.round(n * rh / rw), rows = Math.round(n * rh / rw);
      ctx.fillStyle = '#000';
      for (let y = 0; y < rows; y++) for (let x = 0; x < n; x++) if (MV.rnd(x * 71 + y * 977) > reveal) ctx.fillRect(rx + x * cw, ry + y * chh, cw + 1, chh + 1);
    } else warp(ctx, r2, k, wobble, t);
    if (bright > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${bright * 0.5})`; ctx.fillRect(r2[0], r2[1], r2[2], r2[3]); ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
    bezel(era, rect, t);
    const fade = Math.max(fx.fade || 0, shutdown);
    if (fade > 0) { ctx.fillStyle = '#000'; ctx.globalAlpha = clamp(fade); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  };
})();
