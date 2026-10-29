// Visual kit for the IPS / OLED chapters: the NancyLu-style motion-graphics layer.
// Everything is a pure function of t (seconds). Design space is 1920x1080.
import React from 'react';
import { AbsoluteFill, Img, staticFile, getStaticFiles } from 'remotion';

export const C = {
  bg: '#0a0f17', oled: '#000000', ink: '#f2f4f8', dim: '#6b7a90', faint: '#2a3a52', line: '#1c2636',
  sys: '#4fc3ff',            // search system
  bonnie: '#ff4fa8', bonnieDeep: '#2b2533',   // pink-violet + charcoal (wiki avatar)
  fanny: '#ffc24a', fannyNavy: '#2a3a9a', ribbon: '#e0303a',
  err: '#ff4d4d',
};
export const MONO = "'JetBrains Mono', Consolas, monospace";
export const SANS = "'Inter', 'Microsoft YaHei', sans-serif";
export const CJK = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (u, a, b) => clamp((u - a) / (b - a));
export const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
export const easeIn = (u) => Math.pow(clamp(u), 3);
export const easeInOut = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const back = (u) => { u = clamp(u); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
export const hash = (i) => { let v = ((i | 0) + 0x9e3779b9) >>> 0; v = Math.imul(v ^ (v >>> 16), 0x7feb352d) >>> 0; v = Math.imul(v ^ (v >>> 15), 0x846ca68b) >>> 0; return ((v ^ (v >>> 16)) & 65535) / 65536; };
export const blink = (t, hz = 2) => Math.floor(t * hz * 2) % 2 === 0;
const GL = '01{}()<>[];:=+-*/#%&@$?ABCDEF';

const files = new Set(getStaticFiles().map((f) => f.name));
export const hasFile = (name) => files.has(name);

// ---------- ground & frame ----------
export const Ground = ({ t, era }) => {
  const oled = era === 'oled';
  return (
    <AbsoluteFill style={{ background: oled ? C.oled : C.bg }}>
      {!oled && <AbsoluteFill style={{ background: `radial-gradient(ellipse at 70% 40%, #13203200 0%, #0a0f17 70%), linear-gradient(115deg, transparent 40%, rgba(79,195,255,0.035) 50%, transparent 60%)` }} />}
      <AbsoluteFill style={{
        opacity: oled ? 0.35 : 0.6,
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize: '80px 80px', backgroundPosition: `${-(t * 6) % 80}px 0`,
      }} />
    </AbsoluteFill>
  );
};

export const Hud = ({ t, chapter, shot, accent = C.sys, bpm, era }) => {
  const clock = `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  const s = { position: 'absolute', fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: C.dim, textTransform: 'uppercase' };
  return (
    <AbsoluteFill>
      <div style={{ ...s, left: 48, top: 30 }}>BONNIE&nbsp;&nbsp;/&nbsp;&nbsp;CASE #007</div>
      <div style={{ ...s, right: 48, top: 30, color: accent }}>{chapter}&nbsp;&nbsp;/&nbsp;&nbsp;{shot}</div>
      <div style={{ position: 'absolute', left: 48, right: 48, top: 58, height: 1, background: C.faint }} />
      <div style={{ position: 'absolute', left: 48, right: 48, bottom: 58, height: 1, background: C.faint }} />
      <div style={{ ...s, left: 48, bottom: 30 }}>{era || 'UNION CITY NET'}</div>
      <div style={{ ...s, right: 48, bottom: 30 }}>{clock}&nbsp;&nbsp;/&nbsp;&nbsp;{bpm} BPM</div>
    </AbsoluteFill>
  );
};

export const Caption = ({ en, zh, t0, t }) => {
  const k = Math.floor((t - t0) * 40) + 1;
  return (
    <div style={{ position: 'absolute', right: 64, bottom: 84, textAlign: 'right' }}>
      <div style={{ fontFamily: MONO, fontSize: 20, color: C.ink, letterSpacing: 1 }}>{[...(en || '')].slice(0, k).join('')}</div>
      <div style={{ fontFamily: CJK, fontSize: 22, color: C.dim, marginTop: 6 }}>{[...(zh || '')].slice(0, k).join('')}</div>
    </div>
  );
};

// ---------- text ----------
// Typed text whose head scrambles through program glyphs (NancyLu's "streaming" lines).
export const typed = (str, t, at, cps = 24, scramble = 3) => {
  const chars = [...str], n = Math.floor((t - at) * cps);
  if (n <= 0) return '';
  if (n >= chars.length + scramble) return str;
  const out = chars.slice(0, Math.min(n, chars.length));
  for (let i = 0; i < scramble && n - scramble + i < chars.length && n - scramble + i >= 0; i++) {
    const j = n - scramble + i;
    if (j < out.length && chars[j] !== ' ') out[j] = GL[Math.floor(hash(j * 31 + Math.floor(t * 30)) * GL.length)];
  }
  return out.join('');
};
export const Cursor = ({ t, color = C.ink }) => <span style={{ opacity: blink(t, 1.6) ? 1 : 0, color }}>▍</span>;

// Kinetic headline: letters land one by one with a shadow plate in the accent colour.
export const Slam = ({ text, t, at, x, y, size = 180, color = C.ink, plate = C.sys, stagger = 0.035, align = 'left', exit }) => {
  const chars = [...text];
  const out = exit !== undefined ? seg(t, exit, exit + 0.25) : 0;
  return (
    <div style={{ position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? x : undefined, top: y, whiteSpace: 'pre',
      fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.02, opacity: 1 - out }}>
      {chars.map((c, i) => {
        const u = seg(t, at + i * stagger, at + i * stagger + 0.22);
        if (u <= 0) return <span key={i} style={{ opacity: 0 }}>{c}</span>;
        const s = 1 + (1 - back(u)) * 0.6;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', transform: `translateY(${(1 - easeOut(u)) * -size * 0.4}px) scale(${s}) skewX(${(1 - u) * -12}deg)`, opacity: clamp(u * 3) }}>
            <span style={{ position: 'absolute', left: size * 0.035, top: size * 0.035, color: plate, opacity: 0.9 }}>{c}</span>
            <span style={{ position: 'relative', color }}>{c}</span>
          </span>
        );
      })}
    </div>
  );
};

// ---------- windows ----------
export const Win = ({ x, y, w, h, title, status = 'STREAMING', accent = C.sys, t, enter = 0, children, foot = 'case context retained', progress }) => {
  const u = easeOut(seg(t, enter, enter + 0.35));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity: u, transform: `translateY(${(1 - u) * 24}px)`,
      background: 'rgba(9,14,22,0.92)', border: `1px solid ${C.faint}`, boxShadow: '0 20px 60px rgba(0,0,0,0.45)', fontFamily: MONO }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: `1px solid ${C.line}`, fontSize: 14, color: C.dim, gap: 10 }}>
        <span style={{ color: C.faint, letterSpacing: 3 }}>● ● ●</span>
        <span style={{ color: C.ink, opacity: 0.85 }}>{title}</span>
        <span style={{ marginLeft: 'auto', color: accent, fontSize: 12, letterSpacing: 2 }}>{status}</span>
      </div>
      <div style={{ padding: '18px 22px', fontSize: 22, lineHeight: 1.65, color: C.ink, position: 'relative', height: h - 36 - 44, overflow: 'hidden' }}>{children}</div>
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 14, fontSize: 11, color: C.dim, letterSpacing: 1 }}>
        {foot}
        <div style={{ marginTop: 6, height: 2, background: C.line }}><div style={{ height: 2, width: `${(progress ?? clamp((t - enter) / 6)) * 100}%`, background: accent }} /></div>
      </div>
    </div>
  );
};

// ---------- graphics ----------
export const SpeedLines = ({ cx, cy, t, color = C.ink, count = 46, from = 220, alpha = 0.5, seed = 1 }) => (
  <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
    {Array.from({ length: count }, (_, i) => {
      const a = hash(i * 7 + seed) * Math.PI * 2, sp = 0.6 + hash(i * 13 + seed) * 1.4;
      const ph = (t * sp + hash(i * 3 + seed)) % 1, r0 = from + ph * 1300, len = 60 + hash(i * 5 + seed) * 380;
      const w = hash(i * 11 + seed) < 0.15 ? 10 : 2;
      return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * (r0 + len)} y2={cy + Math.sin(a) * (r0 + len)}
        stroke={hash(i * 17 + seed) < 0.2 ? C.sys : color} strokeWidth={w} opacity={alpha * (1 - ph * 0.6)} />;
    })}
  </svg>
);

export const WireGlobe = ({ cx, cy, r, t, color = C.sys, ping, label }) => {
  const rot = t * 0.35, tilt = 0.35, P = [];
  const proj = (lat, lon) => {
    const x = Math.cos(lat) * Math.sin(lon + rot), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon + rot);
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return [cx + x * r, cy - y2 * r, z2];
  };
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  for (let k = 0; k < 12; k++) { const lon = (k / 12) * Math.PI * 2; P.push(Array.from({ length: 41 }, (_, i) => proj(-Math.PI / 2 + (i / 40) * Math.PI, lon))); }
  for (let k = 1; k < 8; k++) { const lat = -Math.PI / 2 + (k / 8) * Math.PI; P.push(Array.from({ length: 61 }, (_, i) => proj(lat, (i / 60) * Math.PI * 2))); }
  const pp = ping ? proj(ping.lat, ping.lon) : null;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
      {P.map((pts, i) => <path key={i} d={path(pts)} fill="none" stroke={color} strokeWidth={1} opacity={0.28} />)}
      <ellipse cx={cx} cy={cy + r * 0.05} rx={r * 1.35} ry={r * 0.18} fill="none" stroke={color} strokeWidth={1} opacity={0.35} transform={`rotate(-12 ${cx} ${cy})`} />
      {pp && pp[2] > -0.2 && <g>
        <circle cx={pp[0]} cy={pp[1]} r={6} fill={ping.color} />
        <circle cx={pp[0]} cy={pp[1]} r={6 + ((t * 1.5) % 1) * 40} fill="none" stroke={ping.color} strokeWidth={2} opacity={1 - ((t * 1.5) % 1)} />
        {label && <text x={pp[0] + 16} y={pp[1] - 12} fill={ping.color} fontFamily={MONO} fontSize={16} letterSpacing={2}>{label}</text>}
      </g>}
    </svg>
  );
};

// ---------- portraits ----------
// A portrait slot: the GPT-generated PNG if present, otherwise the wiki pixel avatar
// blown up as a placeholder, framed and labelled with its slot id.
export const Plate = ({ slot, who, x, y, w, h, t, enter = 0, accent, flipBand, dim = 0, from = 'right' }) => {
  const u = easeOut(seg(t, enter, enter + 0.5));
  const dx = (1 - u) * (from === 'right' ? 160 : -160);
  const file = `portraits/${slot}.png`, real = hasFile(file);
  const band = flipBand ? `polygon(0 0, 62% 0, 38% 100%, 0 100%)` : `polygon(38% 0, 100% 0, 100% 100%, 62% 100%)`;
  return (
    <div style={{ position: 'absolute', left: x + dx, top: y, width: w, height: h, opacity: u * (1 - dim) }}>
      <div style={{ position: 'absolute', inset: 0, background: accent, clipPath: band, opacity: 0.95 }} />
      {real ? (
        <Img src={staticFile(file)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom' }} />
      ) : (
        <>
          <Img src={staticFile(`avatars/${who}_px20.png`)} style={{ position: 'absolute', left: '12%', bottom: '6%', width: '76%', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.6))' }} />
          <div style={{ position: 'absolute', inset: 12, border: `2px dashed ${C.dim}`, opacity: 0.6 }} />
          <div style={{ position: 'absolute', left: 22, top: 18, fontFamily: MONO, fontSize: 14, color: C.ink, background: 'rgba(0,0,0,0.6)', padding: '3px 8px', letterSpacing: 1 }}>
            ASSET · {slot}
          </div>
        </>
      )}
    </div>
  );
};

// A portrait printed in characters: dot-matrix ghost / dissolve. density 0..1, decode 0..1.
const imgCache = new Map();
function loadImg(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const img = new Image(); img.src = src; imgCache.set(src, img); return img;
}
// Called once under delayRender so canvases never draw before their image exists.
export const preloadImages = (srcs) => Promise.all(srcs.map((src) => new Promise((res) => {
  const i = loadImg(src);
  if (i.complete && i.naturalWidth) res(); else { i.addEventListener('load', res); i.addEventListener('error', res); }
})));
export const portraitSrcs = () => [staticFile('avatars/bonnie_px20.png'), staticFile('avatars/fanny_px20.png'),
  ...[...files].filter((f) => f.startsWith('portraits/') && f.endsWith('.png')).map((f) => staticFile(f))];
// Cache the small source-image sample. Only time-dependent density/flicker is
// rebuilt per frame; the visible glyphs are SVG rows so HTML-in-canvas captures
// their paint records reliably (transparent nested Canvas text can disappear).
const glyphRasterCache = new Map();
const GLYPH_TONES = [
  { glyph: '.', opacity: 0.41 }, { glyph: ':', opacity: 0.56 },
  { glyph: '+', opacity: 0.73 }, { glyph: '#', opacity: 0.94 },
];
function glyphRaster(src, cols, rows) {
  const key = `${src}|${cols}|${rows}`;
  if (glyphRasterCache.has(key)) return glyphRasterCache.get(key);
  const img = loadImg(src);
  if (!img.complete || !img.naturalWidth) return null;
  const cv = document.createElement('canvas'); cv.width = cols; cv.height = rows;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = !src.includes('px20');
  const k = Math.min(cols / img.naturalWidth, (rows * 1.6) / img.naturalHeight);
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k / 1.6;
  ctx.drawImage(img, (cols - dw) / 2, rows - dh, dw, dh);
  const pixels = ctx.getImageData(0, 0, cols, rows).data;
  const cells = Array.from({ length: rows * cols }, (_, i) => {
    if (pixels[i * 4 + 3] < 100) return -1;
    const l = (pixels[i * 4] * 0.3 + pixels[i * 4 + 1] * 0.59 + pixels[i * 4 + 2] * 0.11) / 255;
    return l > 0.7 ? 3 : l > 0.45 ? 2 : l > 0.2 ? 1 : 0;
  });
  glyphRasterCache.set(key, cells);
  return cells;
}
export const GlyphPortrait = ({ slot, who, x, y, w, h, t, color = C.fanny, density = 1, cols = 80, flicker = 0.2 }) => {
  const file = `portraits/${slot}.png`;
  const src = hasFile(file) ? staticFile(file) : staticFile(`avatars/${who}_px20.png`);
  const cw = w / cols, rows = Math.max(1, Math.floor(h / (cw * 1.6))), ch = h / rows;
  const raster = glyphRaster(src, cols, rows), f = Math.floor(t * 18);
  const planes = GLYPH_TONES.map(() => Array.from({ length: rows }, () => Array(cols).fill(' ')));
  if (raster) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const tone = raster[r * cols + c];
    if (tone < 0 || hash(c * 131 + r * 977) > density || hash(c * 7 + r * 13 + f) < flicker * 0.4) continue;
    planes[tone][r][c] = GLYPH_TONES[tone].glyph;
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {planes.flatMap((plane, tone) => plane.map((chars, r) => {
        const text = chars.join('');
        return text.trim() ? <text key={`${tone}-${r}`} x={0} y={r * ch} textLength={w} lengthAdjust="spacing" xmlSpace="preserve" dominantBaseline="text-before-edge"
          fontFamily={MONO} fontSize={Math.round(ch * 0.95)} fill={color} opacity={GLYPH_TONES[tone].opacity} style={{ whiteSpace: 'pre' }}>{text}</text> : null;
      }))}
    </svg>
  );
};

// Horizontal tear: n slices of the children shifted sideways (cheap: CSS clip-path copies).
export const Tear = ({ t, amount, children }) => {
  if (amount < 0.05) return <AbsoluteFill>{children}</AbsoluteFill>;
  const f = Math.floor(t * 20), n = Math.ceil(amount * 4);
  return (
    <AbsoluteFill>
      <AbsoluteFill>{children}</AbsoluteFill>
      {Array.from({ length: n }, (_, i) => {
        if (hash(f * 13 + i) > amount) return null;
        const y = hash(f * 7 + i) * 100, hh = 1 + hash(f + i * 3) * 6, dx = (hash(f * 5 + i) - 0.5) * 120 * amount;
        return <AbsoluteFill key={i} style={{ clipPath: `inset(${y}% 0 ${Math.max(0, 100 - y - hh)}% 0)`, transform: `translateX(${dx}px)`, filter: i % 2 ? 'hue-rotate(160deg)' : 'none' }}>{children}</AbsoluteFill>;
      })}
    </AbsoluteFill>
  );
};
