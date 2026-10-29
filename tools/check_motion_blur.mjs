// Render matching sharp / temporally sampled frames for both visual engines.
// This is a visual QA aid; it does not change the composition or render a film.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'out/motion-blur-check');
fs.mkdirSync(output, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.js'), publicDir: path.join(root, 'public') });
console.log('bundle ready');
const browserExecutable = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await openBrowser('chrome', { browserExecutable, logLevel: 'warn' });
try {
  console.log('browser ready');
  const composition = await selectComposition({ serveUrl, id: 'WorldSearchYou', puppeteerInstance: browser });
  console.log('composition ready', composition.width, composition.height, composition.fps);
  for (const [name, time] of [['first', 0], ['ascii', 48.9], ['modern', 152.7]]) {
    for (const motionBlur of [false, true]) {
      const file = path.join(output, `${name}-${motionBlur ? 'blur' : 'sharp'}.png`);
      const inputProps = { motionBlur, motionBlurSamples: 4, shutterAngle: 180 };
      await renderStill({
        composition: { ...composition, props: { ...composition.props, ...inputProps } }, serveUrl, puppeteerInstance: browser,
        frame: Math.round(time * composition.fps), imageFormat: 'png', output: file, scale: 1,
        inputProps,
        onBrowserLog: (log) => { if (log.type === 'error') console.error(log.text); },
      });
      console.log('saved', path.relative(root, file));
    }
  }
} catch (error) {
  console.error('Motion-blur QA failed:', error);
  process.exitCode = 1;
} finally {
  await browser.close({ silent: true }).catch(() => {});
}
