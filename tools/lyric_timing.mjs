// Fetch the *timing* of each sung line from lrclib.net and keep nothing else.
//   node tools/lyric_timing.mjs  ->  public/data/lyric_timing.json
// Each entry: line index, start time, character count, word count, script (lat/cjk/mix).
// Lyric text is never written anywhere: put your own text in public/data/lyrics_text.txt
// (one line per sung line, same order) and tools/lyrics.mjs merges it with this timing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_ = 'https://lrclib.net/api/search?artist_name=Mili&track_name=' + encodeURIComponent('world.search(you)');
const IDS = [18708682, 24543761, 11565042]; // three independent 71-line entries, ~294-295 s

async function get() {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(URL_, { headers: { 'User-Agent': 'world-search-mv/0.2 (fan project)' } });
      if (r.ok) return await r.json();
    } catch {}
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  throw new Error('lrclib unreachable');
}

const entries = (await get()).filter((x) => IDS.includes(x.id));
const timing = (x) => x.syncedLyrics.split(/\n/).map((l) => {
  const m = l.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
  if (!m) return null;
  const s = m[3].trim(), cjk = /[぀-ヿ㐀-鿿]/.test(s), lat = /[A-Za-z]/.test(s);
  return { t: +m[1] * 60 + +m[2], chars: [...s].length, words: s ? s.split(/\s+/).length : 0, script: cjk && lat ? 'mix' : cjk ? 'cjk' : lat ? 'lat' : '-' };
}).filter(Boolean);
const sets = entries.map(timing);
// Consensus start time: median of the entries per line.
const lines = sets[0].map((a, i) => {
  const ts = sets.map((s) => s[i]?.t).filter((v) => v !== undefined).sort((p, q) => p - q);
  return { i, t: +ts[Math.floor(ts.length / 2)].toFixed(2), spread: +(ts[ts.length - 1] - ts[0]).toFixed(2), chars: a.chars, words: a.words, script: a.script };
});
fs.mkdirSync(path.join(ROOT, 'public/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/data/lyric_timing.json'), JSON.stringify(lines, null, 1));
console.log(`${lines.length} lines from ${sets.length} entries`);
console.log(' #      t  spread chars words script');
lines.forEach((l) => console.log(String(l.i).padStart(2), l.t.toFixed(2).padStart(7), l.spread.toFixed(2).padStart(6), String(l.chars).padStart(5), String(l.words).padStart(5), ' ', l.script));
