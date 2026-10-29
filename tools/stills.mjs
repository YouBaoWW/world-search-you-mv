// Render stills at song times through Remotion, plus an optional contact sheet.
//   node tools/stills.mjs                    one still per shot (60% into it)
//   node tools/stills.mjs --at 3,61,190.5    specific times (seconds)
//   node tools/stills.mjs --sheet out/sheet.png --cols 4
//   --scale controls the saved PNG size. Capture stays at DPR 1 because Chrome
//   156 mis-scales ordinary canvases inside HTML-in-canvas at fractional DPR.
//   --no-motion-blur is only for sharp-frame visual diagnostics.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import ffmpeg from 'ffmpeg-static';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };

// Use the installed Chrome: Remotion's own headless-shell download can't unpack under very long paths.
const browserExecutable = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p)) || null;
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.js'), publicDir: path.join(ROOT, 'public') });
const inputProps = { motionBlur: !argv.includes('--no-motion-blur') };
const composition = await selectComposition({ serveUrl, id: 'WorldSearchYou', browserExecutable, inputProps });
const fps = composition.fps;
const scale = +opt('scale', 0.5);
if (!Number.isFinite(scale) || scale <= 0) throw new Error('--scale must be a positive number');

// Shot list comes from the timeline file itself (plain script, evaluate it here).
const window = {}; globalThis.window = window;
window.MV = { mix: (a, b, u) => a + (b - a) * u };
await import(new URL('../src/ascii/timeline.js', import.meta.url));
const MV = window.MV;
const times = opt('at') ? opt('at').split(',').map(Number)
  : MV.SHOTS.map((s, i) => { const n = MV.SHOTS[i + 1]; return +(s.at + ((n ? n.at : MV.DURATION) - s.at) * 0.6).toFixed(2); });

const dir = path.join(ROOT, 'out/stills');
fs.mkdirSync(dir, { recursive: true });
const made = [];
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * fps));
  const shot = MV.SHOTS[MV.shotIndex(t)].id;
  const output = path.join(dir, `${shot}_${t.toFixed(2)}s.png`);
  const fullOutput = scale === 1 ? output : path.join(dir, `.${shot}_${t.toFixed(2)}s-full.png`);
  await renderStill({ composition, serveUrl, output: fullOutput, frame, browserExecutable, inputProps, imageFormat: 'png', scale: 1 });
  if (scale !== 1) {
    const width = Math.max(1, Math.round(composition.width * scale));
    const height = Math.max(1, Math.round(composition.height * scale));
    const resized = spawnSync(ffmpeg, ['-v', 'error', '-nostdin', '-y', '-i', fullOutput, '-frames:v', '1', '-vf', `scale=${width}:${height}:flags=lanczos`, output], { stdio: 'inherit' });
    if (resized.error || resized.status !== 0) throw resized.error || new Error(`PNG resize failed: ${resized.status}`);
    fs.rmSync(fullOutput);
  }
  made.push(output);
  console.log('still', path.relative(ROOT, output));
}
if (opt('sheet')) {
  const cols = +opt('cols', 3), seq = path.join(ROOT, 'out/.seq');
  fs.rmSync(seq, { recursive: true, force: true }); fs.mkdirSync(seq, { recursive: true });
  made.forEach((f, i) => fs.copyFileSync(f, path.join(seq, String(i + 1).padStart(3, '0') + '.png')));
  const rows = Math.ceil(made.length / cols);
  spawnSync(ffmpeg, ['-v', 'error', '-y', '-i', path.join(seq, '%03d.png'), '-frames:v', '1', '-vf', `scale=640:360,tile=${cols}x${rows}:padding=4:color=0x111111`, path.resolve(ROOT, opt('sheet'))], { stdio: 'inherit' });
  fs.rmSync(seq, { recursive: true, force: true });
  console.log('sheet', opt('sheet'));
}
