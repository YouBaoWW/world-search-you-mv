import { Config } from '@remotion/cli/config';
import { existsSync } from 'node:fs';
import path from 'node:path';

// PNG preserves the browser's RGB pixels. Remotion's bt709 conversion then
// encodes limited-range YUV and writes matching matrix / primaries / transfer tags.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setEntryPoint('src/index.js');

// Prefer an installed browser: the bundled headless-shell can fail to unpack
// under long Windows paths. The same selection applies to Studio and rendering.
const requestedBrowser = process.env.CHROME_PATH?.trim();
if (requestedBrowser && !existsSync(requestedBrowser)) {
  throw new Error(`CHROME_PATH does not exist: ${requestedBrowser}`);
}
const windowsRoots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
const browserCandidates = [
  requestedBrowser,
  ...windowsRoots.flatMap((root) => [
    path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean);
const browserExecutable = browserCandidates.find((candidate) => existsSync(candidate));
if (!browserExecutable) {
  throw new Error('Install Chrome or Edge, or set CHROME_PATH to its executable before running Remotion.');
}
Config.setBrowserExecutable(browserExecutable);
