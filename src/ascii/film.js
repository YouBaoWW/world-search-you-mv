/* ASCII layer frame: HUD in the reference project's layout + the current shot,
   then display.js paints it through the era's hardware. */
(function () {
  const MV = window.MV, ST = MV.ST, clamp = MV.clamp;

  MV.lyrics = null;
  let ready = null;
  // base = URL prefix of public/ (Remotion staticFile('') ).
  MV.initAscii = function (base, exists) {
    if (!ready) ready = Promise.all([
      MV.loadPixelArt(base + 'avatars/'),
      MV.loadPortraits(base + 'portraits/', (f) => exists('portraits/' + f)),
    ]);
    return ready;
  };

  MV.beatAt = function (t, bands) {
    if (bands && bands.length) {
      let s = 0; for (let i = 0; i < 8; i++) s += bands[i] || 0;
      return { pulse: clamp((s / 8) * 1.6), bands, beat: ((t - (MV.BEAT0 || 0)) * MV.BPM) / 60 };
    }
    const b = ((t - (MV.BEAT0 || 0)) * MV.BPM) / 60, ph = b - Math.floor(b), out = [];
    for (let i = 0; i < 48; i++) out.push(clamp(Math.exp(-ph * 5) * (1 - i / 60) * (0.6 + 0.4 * MV.rnd(i + Math.floor(t * 12))) * (t > 1 ? 1 : 0)));
    return { pulse: Math.exp(-ph * 6), bands: out, beat: b };
  };

  const cueAt = (t) => {
    if (!MV.lyrics) return null;
    let hit = null;
    for (const l of MV.lyrics) if (t >= l.time && t < (l.end ?? l.time + 4)) hit = l;
    return hit;
  };
  const blink = (t, hz = 2) => Math.floor(t * hz * 2) % 2 === 0;
  const clock = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor(t * 10) % 10}`;

  // Dossiers keep the card below their portrait, inside the two data rails.
  // Other shots retain the top-right panel.
  function candidate(g, A, t, c, shot) {
    const human = c.form === 'human';
    const sz = human ? { w: 12, h: MV.pixelArtRows(12) } : MV.spriteSize(c.form);
    const dossier = shot.scene === 'bonnie' || shot.scene === 'fanny';
    const w = Math.max(26, sz.w + 6), h = sz.h + (dossier ? 5 : 7);
    const rail = Math.max(13, Math.min(20, Math.floor(g.w / 7)));
    const x = dossier ? (shot.scene === 'bonnie' ? A.l + rail + 3 : A.r - rail - 1 - w) : A.r - w + 1;
    const y = dossier ? A.b - h + 1 : A.t + 1, imageY = y + (dossier ? 1 : 2);
    g.panel(x, y, w, h, ST.C, 'CANDIDATE FORM');
    if (t - c.t0 < 0.25) return;
    if (human) MV.pixelArt(g, Math.round(x + w / 2 - 6), imageY, 'fanny', { cols: 12, t, corrupt: 0.5 - c.match / 200 });
    else MV.sprite(g, Math.round(x + w / 2 - sz.w / 2), imageY, c.form, { t });
    g.put(x + 2, y + h - (dossier ? 3 : 4), 'FORM  ' + c.label, ST.W);
    const k = MV.clamp((t - c.t0 - 0.4) / 1.4);
    const m = c.match < 0 ? '#?%$&'[Math.floor(t * 12) % 5].repeat(3) : `${Math.round(c.match * k)}%`;
    g.put(x + 2, y + h - (dossier ? 2 : 3), 'MATCH ' + m + (k >= 1 && c.match === 0 ? '  NO MATCH' : ''), c.match > 0 ? ST.Y : ST.R);
  }
  // A short sung line printed in block letters across the middle of the screen.
  function bigLine(g, A, t, cue) {
    const text = cue.en.toUpperCase().replace(/[^A-Z0-9 '.?!-]/g, '');
    const n = Math.min(text.length, Math.floor((t - cue.time) * 14) + 1), shown = text.slice(0, n);
    const y = Math.round(A.cy - 3);
    g.fill(A.l, y - 2, A.w, 9, ' ', ST.K);
    g.put(A.l, y - 2, '-'.repeat(A.w), ST.D); g.put(A.l, y + 6, '-'.repeat(A.w), ST.D);
    g.big(y, shown, ST.W, 1, 1, '#', A.cx - ((text.length - shown.length) * 6) / 2);
  }

  MV.composeAscii = function (g, t, fx, era, bands) {
    const { shot, e, d, u } = MV.shotAt(t);
    const hud = shot.hud !== false, b = MV.beatAt(t, bands);
    const A = { l: 2, t: hud ? 4 : 1, r: g.w - 3, b: hud ? g.h - 8 : g.h - 2 };
    A.w = A.r - A.l + 1; A.h = A.b - A.t + 1; A.cx = (A.l + A.r) / 2; A.cy = (A.t + A.b) / 2;
    g.clip = [0, A.t, g.w - 1, A.b];
    // pace stretches a scene's internal timing to its bar-aligned length.
    const pace = shot.pace || 1;
    MV.SCENES[shot.scene]({ g, t, e: e * pace, d: d * pace, u, A, fx, pulse: b.pulse, beat: b.beat, shot });
    g.clip = null;
    const gk = MV.glitchAt(t);
    MV.glitch(g, t, gk, A.t, A.b);
    // A cut inside one display era: three frames of tearing on the bar line.
    if (shot.at > 0 && e < 0.06 && !MV.eraAt(t).trans) fx.tear = Math.max(fx.tear || 0, 0.7);
    if (gk > 0.5) fx.tear = Math.max(fx.tear || 0, (gk - 0.5) * 0.8);
    if (!hud) return;
    const cand = MV.candidateAt(t);
    if (cand) candidate(g, A, t, cand, shot);
    const lc = cueAt(t), lp = lc && MV.LYRIC_PLAN.find((p) => lc.n >= p.from && lc.n <= p.to);
    if (lp && lp.style === 'big') bigLine(g, A, t, lc);
    // HUD, laid out like the reference player.
    const ch = MV.CHAPTERS.filter((c) => c.at <= t).pop();
    g.put(2, 0, MV.TITLE, ST.B);
    const ck = `${clock(t)} / ${clock(MV.DURATION).slice(0, 5)}  RUNNING`;
    g.put(g.w - ck.length - 2, 0, ck, ST.D);
    g.put(2, 1, '-'.repeat(g.w - 4), ST.D);
    g.put(2, 2, ch.en, ST.N);
    g.put(g.w - 20, 2, 'CASE #007 · AGT 006', ST.D);
    const sy = g.h - 6, cols = Math.min(80, g.w - 8), sx = Math.floor((g.w - cols) / 2);
    for (let i = 0; i < cols; i++) { const a = b.bands[Math.floor((i * b.bands.length) / cols)] || 0; g.set(sx + i, sy, '._:=|'[Math.min(4, Math.round(a * 4))], ST.D); }
    // Two reserved lines per language keep the caption band still.
    // Lyrics are typed into the band like program output; placeholder lines show their
    // word lengths as blocks plus the slot number. Without a line, the case log runs.
    const cue = cueAt(t);
    let en = shot.log, zh = shot.logZh, k = Math.floor(e * 40) + 1;
    if (cue) {
      en = cue.placeholder
        ? `[L${String(cue.n).padStart(2, '0')}] ` + Array.from({ length: cue.words || 1 }, (_, j) => '#'.repeat(2 + Math.floor(MV.rnd(cue.n * 31 + j) * 6))).join(' ')
        : cue.en;
      zh = cue.zh;
      k = Math.floor((t - cue.time) / Math.max(0.5, (cue.end - cue.time) * 0.75) * [...en].length) + 1;
    }
    if (en) g.center(g.h - 5, [...en].slice(0, k).join('') + (cue && k < [...en].length && blink(t, 3) ? '_' : ''), cue ? ST.W : ST.N);
    if (zh) g.center(g.h - 3, [...zh].slice(0, cue ? 99 : k).join(''), cue ? ST.B : ST.D);
    const hint = `${shot.id}   ·   ${era.label}`;
    g.center(g.h - 1, hint, ST.G);
  };

  MV.renderAscii = function (t, bands) {
    const { era, trans } = MV.eraAt(t);
    const g = new MV.Grid(era.cols, era.rows);
    const fx = { flash: 0, shake: 0, tear: 0, rgb: 0, fade: 0, bloom: 1 };
    MV.composeAscii(g, t, fx, era, bands);
    MV.paint(g, fx, t, era, trans);
    return { shot: MV.shotAt(t).shot.id, era: era.id };
  };
})();
