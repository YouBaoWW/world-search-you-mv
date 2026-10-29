// Latin faces are bundled (deterministic). CJK uses the system face (Microsoft YaHei on Windows)
// so canvas text never swaps fonts mid-render while unicode-range subsets load.
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/vt323/400.css';

export const fontsReady = () => Promise.all([
  document.fonts.load("900 40px 'Inter'"), document.fonts.load("400 40px 'Inter'"), document.fonts.load("700 40px 'Inter'"),
  document.fonts.load("400 40px 'JetBrains Mono'"), document.fonts.load("700 40px 'JetBrains Mono'"), document.fonts.load("400 40px 'VT323'"),
]).then(() => document.fonts.ready);
