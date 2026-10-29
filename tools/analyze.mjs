// Measure public/song.mp3: tempo, beat grid, bar grid, per-bar energy and section changes.
//   node tools/analyze.mjs            -> public/data/analysis.json + a printed bar table
// ffmpeg-static is run single-threaded: its 6.0 build crashes on multithreaded full decodes.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SR = 22050, HOP = 256, N = 1024;

const pcm = await new Promise((ok, bad) => {
  const p = spawn(ffmpeg, ['-v', 'error', '-threads', '1', '-i', path.join(ROOT, 'public/song.mp3'), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
  const chunks = []; p.stdout.on('data', (c) => chunks.push(c)); p.on('error', bad);
  p.on('close', (code) => (code ? bad(new Error('ffmpeg exit ' + code)) : ok(new Float32Array(Buffer.concat(chunks).buffer.slice(0)))));
});
const dur = pcm.length / SR, fps = SR / HOP;

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) {
      const c = Math.cos(a * k), s = Math.sin(a * k), xr = re[i + k + len / 2], xi = im[i + k + len / 2];
      const tr = xr * c - xi * s, ti = xr * s + xi * c;
      re[i + k + len / 2] = re[i + k] - tr; im[i + k + len / 2] = im[i + k] - ti; re[i + k] += tr; im[i + k] += ti;
    }
  }
}

// Per-frame: band energies (low <200Hz, mid 200-2k, high >2k), rms, spectral flux onset strength.
const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
const nF = Math.floor((pcm.length - N) / HOP);
const low = new Float32Array(nF), mid = new Float32Array(nF), high = new Float32Array(nF), rms = new Float32Array(nF), flux = new Float32Array(nF);
let prev = new Float32Array(N / 2);
const bin = (hz) => Math.round((hz * N) / SR);
for (let f = 0; f < nF; f++) {
  const re = new Float32Array(N), im = new Float32Array(N);
  let e = 0;
  for (let i = 0; i < N; i++) { const v = pcm[f * HOP + i]; re[i] = v * win[i]; e += v * v; }
  rms[f] = Math.sqrt(e / N);
  fft(re, im);
  const mag = new Float32Array(N / 2);
  let fl = 0;
  for (let k = 1; k < N / 2; k++) {
    mag[k] = Math.log1p(100 * Math.hypot(re[k], im[k]));
    const d = mag[k] - prev[k]; if (d > 0) fl += d;
    if (k < bin(200)) low[f] += mag[k]; else if (k < bin(2000)) mid[f] += mag[k]; else high[f] += mag[k];
  }
  flux[f] = fl; prev = mag;
}
// Onset envelope: flux minus its local mean.
const onset = new Float32Array(nF);
for (let f = 0; f < nF; f++) {
  let s = 0, n = 0;
  for (let j = Math.max(0, f - 8); j <= Math.min(nF - 1, f + 8); j++) { s += flux[j]; n++; }
  onset[f] = Math.max(0, flux[f] - s / n);
}

// Tempo: autocorrelation of the onset envelope over 70-190 BPM, with an octave-aware score.
function acf(lag) { let s = 0; for (let f = lag; f < nF; f++) s += onset[f] * onset[f - lag]; return s; }
let best = null;
for (let bpm = 70; bpm <= 190; bpm += 0.05) {
  const lag = (60 / bpm) * fps;
  const score = acf(Math.round(lag)) + 0.5 * acf(Math.round(lag * 2)) + 0.25 * acf(Math.round(lag / 2));
  if (!best || score > best.score) best = { bpm, score };
}
const bpm = Math.round(best.bpm * 100) / 100, period = 60 / bpm;
// Beat phase: offset that puts the most onset energy on the grid.
const at = (t) => { const f = Math.round(t * fps); return f >= 0 && f < nF ? onset[f] : 0; };
let bestPh = 0, bestS = -1;
for (let ph = 0; ph < period; ph += 0.002) {
  let s = 0; for (let t = ph; t < dur; t += period) s += at(t) + 0.5 * (at(t - 0.01) + at(t + 0.01));
  if (s > bestS) { bestS = s; bestPh = ph; }
}
const beats = []; for (let t = bestPh; t < dur; t += period) beats.push(+t.toFixed(3));
// Downbeat: which of the 4 beat positions carries the most low-band attack.
const lowOn = (t) => { const f = Math.round(t * fps); return f > 0 && f < nF ? Math.max(0, low[f] - low[f - 1]) : 0; };
let bar0 = 0, barS = -1;
for (let k = 0; k < 4; k++) { let s = 0; for (let i = k; i < beats.length; i += 4) s += lowOn(beats[i]) + at(beats[i]); if (s > barS) { barS = s; bar0 = k; } }
const bars = []; for (let i = bar0; i < beats.length; i += 4) bars.push(beats[i]);
if (bar0 > 0) bars.unshift(+(beats[bar0] - 4 * period).toFixed(3));

// Per-bar features and a novelty curve (change between the 4 bars before and after each bar line).
const mean = (arr, a, b) => { let s = 0, n = 0; for (let f = Math.max(0, Math.round(a * fps)); f < Math.min(nF, Math.round(b * fps)); f++) { s += arr[f]; n++; } return n ? s / n : 0; };
const feat = bars.map((b, i) => { const e = bars[i + 1] ?? b + 4 * period; return [mean(rms, b, e), mean(low, b, e), mean(mid, b, e), mean(high, b, e), mean(onset, b, e)]; });
const z = feat[0].map((_, j) => { const v = feat.map((r) => r[j]), m = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) || 1; return v.map((x) => (x - m) / sd); });
const novelty = bars.map((_, i) => {
  if (i < 2 || i > bars.length - 2) return 0;
  let d = 0;
  for (let j = 0; j < z.length; j++) {
    const before = (z[j][i - 1] + z[j][i - 2]) / 2, after = (z[j][i] + z[j][i + 1]) / 2;
    d += (after - before) ** 2;
  }
  return Math.sqrt(d);
});
const peaks = novelty.map((v, i) => ({ i, t: bars[i], v })).filter((p, i, a) => p.v > 1.2 && p.v >= (a[i - 1]?.v ?? 0) && p.v >= (a[i + 1]?.v ?? 0));

const out = { duration: +dur.toFixed(3), bpm, beatPeriod: +period.toFixed(5), firstBeat: +bestPh.toFixed(3), downbeatIndex: bar0, beats, bars,
  barEnergy: feat.map((r) => r.map((x) => +x.toFixed(4))), novelty: novelty.map((x) => +x.toFixed(3)), sections: peaks.map((p) => ({ bar: p.i, t: p.t, strength: +p.v.toFixed(2) })) };
fs.mkdirSync(path.join(ROOT, 'public/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/data/analysis.json'), JSON.stringify(out));
console.log(`duration ${dur.toFixed(2)}s  bpm ${bpm}  first beat ${bestPh.toFixed(3)}s  downbeat index ${bar0}  bars ${bars.length}`);
console.log('bar   time    rms   low   mid  high onset novelty');
bars.forEach((b, i) => {
  const [r, l, m, h, o] = z.map((col) => col[i]);
  const bar = (v) => (v > 1 ? '##' : v > 0.3 ? '#.' : v > -0.3 ? '..' : v > -1 ? '. ' : '  ');
  console.log(`${String(i).padStart(3)} ${b.toFixed(2).padStart(7)}  ${bar(r)}    ${bar(l)}    ${bar(m)}   ${bar(h)}   ${bar(o)}  ${novelty[i].toFixed(2)}${novelty[i] > 1.2 && peaks.find((p) => p.i === i) ? '  <== section' : ''}`);
});
