// Lyric layer for the modern chapters: caption band + three text-PV styles.
// Text comes only from public/data/lyrics.json (your text, or numbered placeholders that
// draw each word as a bar of its measured length so the layout reads the same).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, MONO, SANS, CJK, clamp, seg, easeOut, back, hash, SpeedLines } from './kit.jsx';

const MV = () => window.MV;

// Words of a line with their entry times: spread over ~75% of the line, snapped to 8th notes.
export function wordsOf(line) {
  const n = Math.max(1, line.words || 1);
  const words = line.placeholder
    ? Array.from({ length: n }, (_, k) => ({ ph: true, len: 2 + Math.floor(hash(line.n * 31 + k) * 6) }))
    : line.en.split(/\s+/).map((w) => ({ text: w, len: w.length }));
  const dur = Math.max(0.6, (line.end - line.time) * 0.75), eighth = 30 / MV().BPM;
  return words.map((w, k) => ({ ...w, at: line.time + Math.round(((k / words.length) * dur) / eighth) * eighth }));
}

const Word = ({ w, size, color, u, plate }) => {
  const s = 1 + (1 - back(u)) * 0.5;
  const style = { display: 'inline-block', whiteSpace: 'nowrap', marginRight: size * 0.28, transform: `translateY(${(1 - easeOut(u)) * -size * 0.3}px) scale(${s})`, opacity: clamp(u * 3), verticalAlign: 'baseline' };
  if (w.ph) return (
    <span style={style}>
      <span style={{ display: 'inline-block', width: w.len * size * 0.52, height: size * 0.62, background: color, opacity: 0.85, boxShadow: plate ? `${size * 0.03}px ${size * 0.03}px 0 ${plate}` : 'none' }} />
    </span>
  );
  return (
    <span style={{ ...style, position: 'relative' }}>
      {plate && <span style={{ position: 'absolute', left: size * 0.03, top: size * 0.03, color: plate, whiteSpace: 'nowrap' }}>{w.text}</span>}
      <span style={{ position: 'relative', color }}>{w.text}</span>
    </span>
  );
};

const Tag = ({ line, x, y, color = C.dim }) => line.placeholder
  ? <div style={{ position: 'absolute', left: x, top: y, fontFamily: MONO, fontSize: 14, color, letterSpacing: 2 }}>LYRIC SLOT · L{String(line.n).padStart(2, '0')}</div>
  : null;

// --- band: two-line caption, bottom-left, word by word ---
export const LyricBand = ({ t, line, accent = C.sys }) => {
  const ws = wordsOf(line), fade = 1 - seg(t, line.end - 0.25, line.end);
  return (
    <div style={{ position: 'absolute', left: 64, bottom: 90, maxWidth: 1180, opacity: fade }}>
      <Tag line={line} x={0} y={-24} />
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, lineHeight: 1.15, color: C.ink, textShadow: '0 2px 18px rgba(0,0,0,0.8)' }}>
        {ws.map((w, k) => t >= w.at && <Word key={k} w={w} size={44} color={C.ink} u={seg(t, w.at, w.at + 0.18)} />)}
      </div>
      {line.zh && <div style={{ fontFamily: CJK, fontSize: 32, fontWeight: 500, lineHeight: 1.4, color: accent, marginTop: 10, textShadow: '0 2px 14px #000' }}>{line.zh}</div>}
    </div>
  );
};

// --- kinetic: words fill the screen in rows of mixed sizes (text-PV A) ---
export const LyricKinetic = ({ t, line, accent }) => {
  const ws = wordsOf(line), fade = 1 - seg(t, line.end - 0.2, line.end);
  const sizes = ws.map((w, k) => (k === ws.length - 1 ? 190 : hash(line.n * 13 + k) > 0.6 ? 150 : hash(line.n * 7 + k) > 0.4 ? 104 : 72));
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Tag line={line} x={120} y={370} />
      <div style={{ position: 'absolute', left: 110, top: 400, width: 1700, fontFamily: SANS, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2 }}>
        {ws.map((w, k) => t >= w.at && (
          <span key={k} style={{ fontSize: sizes[k] }}>
            <Word w={w} size={sizes[k]} color={k % 3 === 2 ? accent : C.ink} plate={k % 3 === 2 ? C.ink : accent} u={seg(t, w.at, w.at + 0.2)} />
          </span>
        ))}
      </div>
      {line.zh && <div style={{ position: 'absolute', left: 120, right: 120, bottom: 120, fontFamily: CJK, fontSize: 34, lineHeight: 1.4, color: accent, textShadow: '0 2px 14px #000' }}>{line.zh}</div>}
    </AbsoluteFill>
  );
};

// --- hook: a one-word line as the whole frame ---
export const LyricHook = ({ t, line, accent }) => {
  // The whole (short) line as one word-object, sized to fit the frame width.
  const ws = wordsOf(line), u = seg(t, line.time, line.time + 0.25);
  const w = ws[0].ph ? { ph: true, len: ws.reduce((a, x) => a + x.len + 1, 0) } : { text: line.en, len: [...line.en].length };
  const size = Math.min(320, 1650 / Math.max(3, w.len * 0.6));
  return (
    <AbsoluteFill>
      <SpeedLines cx={960} cy={540} t={t} color={C.ink} alpha={0.6 * (1 - seg(t, line.time, line.end))} seed={line.n} />
      <AbsoluteFill style={{ background: accent, opacity: 0.25 * (1 - seg(t, line.time, line.time + 0.4)) }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 540 - size * 0.6, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.03,
        transform: `scale(${1 + (1 - back(u)) * 0.8}) rotate(${(1 - u) * -6}deg)` }}>
        <Word w={w} size={size} color={C.ink} plate={accent} u={1} />
      </div>
      {line.zh && <div style={{ position: 'absolute', left: 160, right: 160, bottom: 150, textAlign: 'center', fontFamily: CJK, fontSize: 38, lineHeight: 1.4, color: accent, opacity: easeOut(seg(t, line.time, line.time + 0.25)), textShadow: '0 2px 14px #000' }}>{line.zh}</div>}
      <Tag line={line} x={880} y={540 + size * 0.55} />
    </AbsoluteFill>
  );
};

// --- whisper: one word at a time, very large; the sentence builds small above (text-PV B) ---
export const LyricWhisper = ({ t, line, accent }) => {
  const ws = wordsOf(line), k = ws.filter((w) => t >= w.at).length - 1;
  if (k < 0) return null;
  const cur = ws[k], u = seg(t, cur.at, cur.at + 0.35), fade = 1 - seg(t, line.end - 0.4, line.end);
  const size = cur.ph ? 200 : Math.min(260, 1500 / Math.max(3, cur.len * 0.6));
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 30, letterSpacing: 4, color: C.dim }}>
        {ws.slice(0, k + 1).map((w, j) => <Word key={j} w={w} size={30} color={j === k ? C.ink : C.dim} u={1} />)}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 540 - size * 0.55, textAlign: 'center', fontFamily: SANS, fontWeight: 300, fontSize: size, letterSpacing: size * 0.04,
        opacity: easeOut(u), filter: `blur(${(1 - u) * 12}px)`, transform: `scale(${1.08 - 0.08 * easeOut(u)})` }}>
        <Word w={cur} size={size} color={C.ink} u={1} />
      </div>
      {line.zh && <div style={{ position: 'absolute', left: 160, right: 160, top: 800, textAlign: 'center', fontFamily: CJK, fontSize: 32, lineHeight: 1.5, color: accent, letterSpacing: 3, textShadow: '0 2px 14px #000' }}>{line.zh}</div>}
      <Tag line={line} x={880} y={210} />
    </AbsoluteFill>
  );
};

// --- stack: lines pile up like a terminal log; the newest is large (text-PV C) ---
export const LyricStack = ({ t, lines, accent }) => {
  // Keep the current translation readable below the query history, clear of the result card.
  const shown = lines.filter((l) => t >= l.time).slice(-4);
  return (
    <div style={{ position: 'absolute', left: 110, bottom: 150, width: 1500 }}>
      {shown.map((l, j) => {
        const newest = j === shown.length - 1, age = shown.length - 1 - j, ws = wordsOf(l), size = newest ? 64 : 30;
        return (
          <div key={l.n} style={{ fontFamily: newest ? SANS : MONO, fontWeight: newest ? 900 : 400, fontSize: size, color: newest ? C.ink : C.dim, opacity: newest ? 1 : Math.max(0.25, 0.7 - age * 0.15), marginTop: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 20, color: accent, marginRight: 18 }}>&gt;</span>
            {ws.map((w, k) => (!newest || t >= w.at) && <Word key={k} w={w} size={size} color={newest ? C.ink : C.dim} u={newest ? seg(t, w.at, w.at + 0.18) : 1} />)}
            {newest && l.zh && <div style={{ marginLeft: 36, marginTop: 8, fontFamily: CJK, fontSize: 32, fontWeight: 500, lineHeight: 1.4, color: accent, textShadow: '0 2px 14px #000' }}>{l.zh}</div>}
          </div>
        );
      })}
    </div>
  );
};

// Which presentation a line gets (by line number, see MV.LYRIC_PLAN in timeline.js).
export const planFor = (n) => (MV().LYRIC_PLAN.find((p) => n >= p.from && n <= p.to) || { style: 'band' });

// ASCII sprite as coloured <pre> (same art and colours as the CRT chapters).
export const SpritePre = ({ form, size = 22, t = 0 }) => {
  const M = MV(), spr = M.SPRITES[form];
  return (
    <pre style={{ margin: 0, fontFamily: MONO, fontSize: size, lineHeight: 1.05 }}>
      {spr.art.map((row, y) => (
        <div key={y}>{[...row].map((c, x) => <span key={x} style={{ color: M.PALETTE[spr.color(c, x, y)] }}>{c}</span>)}</div>
      ))}
    </pre>
  );
};

// The form Bonnie is testing (MV.CANDIDATES), as a card under the top-right HUD.
export const CandidateCard = ({ t, c }) => {
  const u = easeOut(seg(t, c.t0, c.t0 + 0.35)), k = clamp((t - c.t0 - 0.4) / 1.4);
  const m = c.match < 0 ? '#?%$&'[Math.floor(t * 12) % 5].repeat(3) : `${Math.round(c.match * k)}%`;
  return (
    <div style={{ position: 'absolute', right: 64, top: 96, width: 330, opacity: u, transform: `translateX(${(1 - u) * 40}px)`, background: 'rgba(9,14,22,0.92)', border: `1px solid ${C.faint}`, fontFamily: MONO }}>
      <div style={{ padding: '8px 14px', fontSize: 12, letterSpacing: 2, color: C.sys, borderBottom: `1px solid ${C.line}` }}>CANDIDATE FORM</div>
      <div style={{ padding: '16px 14px', display: 'flex', justifyContent: 'center', minHeight: 120, alignItems: 'center' }}>
        {c.form === 'human'
          ? <img src={window.MV.__fannySrc} style={{ width: 110, imageRendering: 'pixelated', opacity: 0.6 + c.match / 250 }} />
          : <SpritePre form={c.form} size={20} t={t} />}
      </div>
      <div style={{ padding: '0 14px 12px', fontSize: 16, color: C.ink }}>FORM&nbsp;&nbsp;{c.label}</div>
      <div style={{ padding: '0 14px 14px', fontSize: 16, color: c.match > 0 ? C.fanny : C.err }}>MATCH {m}{k >= 1 && c.match === 0 ? '  · NO MATCH' : ''}</div>
    </div>
  );
};
