// Merge your lyric text with the measured line timing -> public/data/lyrics.json
//   node tools/lyrics.mjs                 uses public/data/lyrics_text.txt if present, else numbered placeholders
//   node tools/lyrics.mjs path/to/file.lrc  takes text (and times) from your own LRC instead
//
// lyrics_text.txt: one line per sung line, in order (67 lines; blank instrumental lines are skipped).
// A line may carry a translation after " | ":   English line | 中文翻译
// No lyric text ships with this project; it only comes from the file you provide.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/lyric_timing.json'), 'utf8'));
const sung = timing.filter((l) => l.chars > 0);
const cjk = /[㐀-鿿]/;
let texts = null, times = null, ends = null;

const src = process.argv[2];
if (src) {
  // Your LRC: lines sharing a timestamp pair up as en / zh.
  const by = new Map();
  for (const line of fs.readFileSync(src, 'utf8').split(/\r?\n/)) {
    const tags = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)], text = line.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of tags) { const t = +m[1] * 60 + +m[2]; if (!by.has(t)) by.set(t, []); if (text) by.get(t).push(text); }
  }
  // Credit lines ("作词 : …", "作曲 : …") are metadata, not sung lines.
  const credit = (x) => /^(作词|作曲|编曲|lyric|music|compose)/i.test(x) || / : /.test(x);
  const all = [...by.keys()].sort((a, b) => a - b);
  const ts = all.filter((t) => by.get(t).length && !by.get(t).every(credit));
  times = ts; ends = ts.map((t) => all.find((x) => x > t + 0.05));
  texts = ts.map((t) => { const p = by.get(t), zh = p.find((x) => cjk.test(x)) || ''; return [p.find((x) => x !== zh) || '', zh]; });
} else if (fs.existsSync(path.join(ROOT, 'public/data/lyrics_text.txt'))) {
  texts = fs.readFileSync(path.join(ROOT, 'public/data/lyrics_text.txt'), 'utf8').split(/\r?\n/).filter((l) => l.trim())
    .map((l) => { const [en, zh] = l.split(' | '); return [en.trim(), (zh || '').trim()]; });
  if (texts.length !== sung.length) console.warn(`warning: ${texts.length} text lines for ${sung.length} sung lines; extra/missing lines are ignored/placeholders`);
}

const all = timing.map((l) => l.t);
// With your LRC its own line count and times win; otherwise the measured timing gives the slots.
const rows = times ? times.map((t, k) => ({ t, end: ends[k], words: 0 })) : sung.map((l) => ({ t: l.t, end: all.find((x) => x > l.t + 0.05), words: l.words }));
const out = rows.map((r, k) => {
  const [en, zh] = texts && texts[k] ? texts[k] : [`♪ L${String(k + 1).padStart(2, '0')}`, ''];
  const end = Math.min(r.end ?? r.t + 4, r.t + 8);
  return { n: k + 1, time: +r.t.toFixed(2), end: +end.toFixed(2), en, zh, words: texts ? en.split(/\s+/).length : r.words, placeholder: !(texts && texts[k]) };
});
fs.writeFileSync(path.join(ROOT, 'public/data/lyrics.json'), JSON.stringify(out, null, 1));
console.log(`wrote public/data/lyrics.json: ${out.length} lines (${out.filter((x) => !x.placeholder).length} with your text, ${out.filter((x) => x.placeholder).length} placeholders)`);
