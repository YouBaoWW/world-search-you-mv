// Writes the "立绘与特效时间轴" section of the prompt pack from src/ascii/timeline.js.
//   node tools/timeline_doc.mjs
// Cue offsets below mirror the constants in src/ascii/scenes.js and src/modern/scenes.jsx:
// [offset, unit, 类别, 内容]. unit 's' = scene seconds into the shot (divided by the shot's pace),
// 'u' = fraction of the shot, 'b' = absolute bar number B(n) for events bound to song time.
// If you change a constant in a scene, change it here too, then re-run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = { MV: { mix: (a, b, u) => a + (b - a) * u } };
await import(new URL('../src/ascii/timeline.js', import.meta.url));
const MV = window.MV;
MV.lyrics = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/lyrics.json'), 'utf8'));

const CUES = {
  S01: [[0, 's', '画面', 'BIOS 文字逐行打出（0–2.8s）'], [1.0, 's', '特效', 'MEM/IDX/LNK 进度条开始'], [3.34, 's', '特效', 'LNK 卡在 37%，变红 ERR'], [3.3, 's', '画面', '检查清单逐项 [ OK ]'], [5.0, 's', '特效', 'LINK TO AGENT 007 [ LOST ]（红）'], [0.85, 'u', '画面', 'SYSTEM READY 闪烁']],
  S02: [[0, 's', '特效', '十六进制数据逐行填满屏幕（至 2.4s）'], [2.0, 's', '画面', '卷宗窗口弹出，进度条 0→100%（至 3.6s）'], [3.6, 's', '画面', '字段逐行打字'], [5.4, 's', '特效', 'STATUS MISSING 红色闪烁'], [6.0, 's', '画面', '输入 open case 007 --search']],
  S03: [[0.2, 's', '立绘入', '邦妮像素头像（数据 0/1 → 色块落定，至 1.8s）'], [17, 'b', '画面', '逐字输入 world.search(you);（打到第 21 小节）'], [21.5, 'b', '特效', '回车闪白 0.25；背景乱码密度上升'], [22, 'b', '立绘出', '像素头像消失，全屏字符打散，飞向标题位置'], [24, 'b', '特效', '标题定格闪白 0.5（★满编进入）'], [27.25, 'b', '特效', '标题字符坠落出画']],
  S04: [[0, 's', '转场', 'EGA 消磁抖动（前后各 0.7s）'], [0, 's', '立绘入', '邦妮像素头像左滑入（0–1.6s），逐行显影（0–1.2s），数据落定（0.4–3.0s）'], [0, 's', '特效', '扫描亮线自上而下（0–2.4s）'], [1.0, 's', '画面', 'AGENT 006 档案面板，字段每 0.45s 一行'], [4.5, 's', '画面', '旋转字符毒苹果 + IF (RESULT) -> ANY_MEANS']],
  S05: [[0.3, 's', '立绘入', '芬妮像素头像逐行显影（至 4s）'], [0, 's', '特效', '持续损坏：乱码比例 22%↔40% 周期起伏'], [0.8, 's', '画面', '档案字段每 0.55s 一行'], [6.0, 's', '特效', 'STATUS MISSING 闪烁']],
  S06: [[0, 's', '立绘入', '左邦妮（色块）/ 右芬妮（混合）同时在场'], [0, 's', '特效', '中线电弧，火花密度随节拍'], [0.75, 'u', '立绘出', '芬妮溶解 0→90%，损坏 8%→48%（至镜头结束）'], [0.825, 'u', '画面', 'No.007 : NO SIGNAL']],
  S07: [[0, 's', '转场', 'CRT 关机塌成横线再开机（前后各 0.8s）'], [0, 's', '立绘入', '地图上邦妮小像素头像（6 格宽）'], [0, 's', '特效', '雷达扫描 1.6 rad/s'], [0.6, 's', '画面', '检索日志每 1.25s 一条，结果 0']],
  S08: [[0.08, 'u', '特效', '标记 1 钟楼 + 线索 放大镜'], [0.38, 'u', '特效', '标记 2 中城大学 + 线索 相机'], [0.68, 'u', '特效', '标记 3 南港 + 线索 草莓蛋糕']],
  S09: [[0.05, 'u', '特效', '粉色足迹延伸（至 0.8u）'], [0.6, 'u', '立绘入', '坠落坑 + 损坏的芬妮小头像（损坏 50%，溶解 30%）'], [0.8, 'u', '画面', '1 PARTIAL MATCH 闪烁']],
  S10: [[0, 's', '转场', 'CRT 关机 → CCFL 背光预热（前后各 1.0s）'], [0.08, 'u', '特效', '坠星下落'], [67, 'b', '特效', '撞击：白闪、震屏、冲击环（★第 67 小节）'], [67.3, 'b', '画面', '二进制 THE FALL + 天 王 落'], [67.24, 'b', '特效', '坑里长出一朵花（至第 68 小节长成；歌词开头先由花候选卡预示）']],
  S11: [[0.05, 'u', '特效', '照片扫描恢复 0→100%（至 0.85u）'], [0.55, 'u', '立绘入', '芬妮数据头像 / F02 随扫描线显影']],
  S12: [[0, 's', '画面', '事件日志每 0.9s 一行'], [76.3, 'b', '特效', '心电图振幅开始衰减'], [77, 'b', '特效', '心电图归零变红（★第 77 小节）'], [77.35, 'b', '特效', 'SIGNAL LOST 闪烁 + 撕裂 0.4；数据轨道减速']],
  S13: [[0, 's', '转场', 'IPS 背光预热（0.7s，阶梯闪烁）'], [0.1, 's', '立绘入', 'F03 芬妮立绘 + 金色色带右侧滑入（0.5s）'], [80, 'b', '特效', 'SEARCH, 砸入 + 速度线 1.2s（★）'], [83, 'b', '特效', 'PARSE, 砸入 + 速度线 1.2s（★）'], [86, 'b', '特效', 'CONFIRM! 砸入 + 速度线 1.2s（★）'], [86.7, 'b', '画面', '打出「搜索，解析，确定！」']],
  S14: [[0, 's', '立绘入', 'B01 邦妮 + 粉色色带左侧滑入'], [0, 's', '立绘入', 'F03 转成金色点阵虚影，密度 55%↔80% 起伏'], [0.2, 's', '画面', '聊天窗口出现'], [0.05, 'u', '画面', '宿舍 · 老鼠事件'], [0.2, 'u', '画面', '006：暴力女！'], [0.34, 'u', '画面', '007：捣蛋鬼。'], [0.5, 'u', '画面', '学号 006/007'], [0.7, 'u', '画面', '006：……你去哪了？'], [0.82, 'u', '特效', '已送达 · 未读；窗口状态 UNREAD']],
  S15: [[0, 's', '立绘入', 'B03 邦妮投掷 + 粉色色带左下滑入'], [0, 's', '画面', 'PERMISSION / DENIED 砸入；5 层防火墙每 0.12s 一层'], [97, 'b', '特效', '命中 L1（苹果提前 0.55s 抛出，窗口碎裂 0.8s）★'], [98, 'b', '特效', '命中 L2 ★'], [99, 'b', '特效', '命中 L3 ★'], [100, 'b', '特效', '命中 L4 ★'], [101, 'b', '特效', '命中 L5 ★'], [101.25, 'b', '画面', '切换 ACCESS / GRANTED（青）']],
  S16: [[-1.2, 's', '转场', 'OLED 像素逐块点亮（共 2.4s）'], [0, 's', '特效', '递归窗口向内缩放 0.5 层/s，you 随节拍放大']],
  S17: [[0, 'u', '立绘入', '芬妮像素卡片逐张铺满（至 0.3u）'], [0.25, 'u', '特效', 'MISMATCH 逐张盖章、变灰（至 0.95u）']],
  S18: [[0.1, 'u', '立绘入', 'F03 点阵虚影由稀到密 15%→90%（至 0.6u），闪烁 40%→10%'], [0.15, 'u', '画面', 'MATCH 0→99.7%（至 0.7u 停住闪烁）'], [0.2, 'u', '特效', '心电图振幅复苏（至 0.45u）']],
  S19: [[0, 's', '立绘入', 'B04 邦妮从左滑入'], [0.2, 's', '立绘入', 'F04 芬妮从右滑入，暗度 35%→0'], [0.05, 'u', '特效', '两人向中线靠近 120px（至 0.6u）'], [0.6, 's', '画面', 'world.connect(006, 007); 窗口'], [132, 'b', '特效', '放大镜开始从右穿过边界'], [133.5, 'b', '特效', '边界涟漪峰值'], [135, 'b', '特效', '放大镜穿过，接 S20 白闪（★全曲最大转折）']],
  S20: [[0, 's', '特效', '全屏白闪 1→0（1.8s）'], [0.6, 's', '立绘入', 'B05 邦妮捧放大镜滑入'], [0, 's', '立绘入', 'P03 草莓蛋糕（无图时用矢量蛋糕）'], [2.0, 's', '画面', '便签窗口，2.6s 起打字'], [3.0, 's', '画面', '02 / 17 淡入（1s）']],
  S21: [[0.5, 's', '画面', '代码逐行打出'], [0.45, 'u', '画面', 'stdout 窗口，0.5u RESULT: 1 MATCH'], [0.6, 'u', '画面', '状态开关出现'], [0.62, 'u', '特效', 'CLOSED/OPEN 随机抖动'], [0.88, 'u', '特效', '停在 OPEN（粉色）']],
  S22: [[152, 'b', '画面', '搜索框打出 world.search(you);'], [155, 'b', '特效', '回车：搜索框上移，骨架屏加载（尾奏起）'], [156, 'b', '画面', '唯一结果卡：芬妮 · MATCH 99.7% · UNVERIFIED'], [158.3, 'b', '画面', '光标悬停在结果卡上'], [167, 'b', '特效', '全部淡出'], [168, 'b', '画面', 'CASE #007 / 未完待续 → 「果然还得是我呀。」→ 片尾署名']],
};

const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const eraAt = (t) => MV.ERA_SCHEDULE.filter((e) => e.at <= t).pop().era;
let md = `<!-- timeline:start（由 tools/timeline_doc.mjs 生成，勿手改） -->
## 6. 立绘与特效时间轴

> 按 \`src/ascii/timeline.js\` 当前时间计算（已对轨：138.75 BPM，第一拍 0.35 秒）。改了时间轴后重新运行 \`node tools/timeline_doc.mjs\`。
> ★ = 建议卡拍点。类别：立绘入 / 立绘出 / 特效 / 转场 / 画面。

### 6.1 显示器换代

| 时间 | 转场 | 从 → 到 | 时长 |
|---|---|---|---|
`;
MV.ERA_SCHEDULE.forEach((e, i) => { if (i) md += `| ${fmt(e.at)} | ${e.kind} | ${MV.ERA_SCHEDULE[i - 1].era} → ${e.era} | ${e.dur}s（前后各半） |\n`; });
md += `\n### 6.2 立绘槽位在场时间\n\n| 槽位 | 镜头 | 在场 |\n|---|---|---|\n`;
const slotUse = { 'wiki 像素头像 · 邦妮': ['S03', 'S04', 'S06', 'S07', 'S08'], 'wiki 像素头像 · 芬妮': ['S05', 'S06', 'S09', 'S11', 'S17'],
  F03_fanny_echo: ['S13', 'S14', 'S18'], B01_bonnie_profile: ['S14'], B03_bonnie_throw: ['S15'], B04_bonnie_reach: ['S19'], F04_fanny_reach: ['S19'], B05_bonnie_magnifier: ['S20'], 'F02_fanny_lastphoto（可选）': ['S11'], 'P03_strawberry_cake（可选）': ['S20'] };
const span = (id) => { const i = MV.SHOTS.findIndex((s) => s.id === id), n = MV.SHOTS[i + 1]; return [MV.SHOTS[i].at, n ? n.at : MV.DURATION]; };
for (const [slot, shots] of Object.entries(slotUse)) md += `| ${slot} | ${shots.join(' ')} | ${shots.map((s) => { const [a, b] = span(s); return `${fmt(a)}–${fmt(b)}`; }).join('，')} |\n`;
md += `\n### 6.3 逐镜头时间轴\n`;
MV.SHOTS.forEach((s, i) => {
  const [a, b] = span(s.id), d = b - a;
  md += `\n**${s.id} · ${s.logZh}**　${fmt(a)}–${fmt(b)}（${d.toFixed(1)}s）· ${eraAt(a)}\n\n| 时间 | 类别 | 内容 |\n|---|---|---|\n`;
  (CUES[s.id] || []).map(([o, unit, k, txt]) => [unit === 'b' ? MV.B(o) : a + (unit === 'u' ? o * d : o / (s.pace || 1)), k, txt]).sort((x, y) => x[0] - y[0])
    .forEach(([t, k, txt]) => { md += `| ${fmt(t)} | ${k} | ${txt} |\n`; });
});
md += `\n### 6.4 故障强度曲线\n\n全片的故障值（0–1），超过 0.35 现代层开始横向撕裂，超过 0.5 字符层开始撕裂：\n\n`;
md += [0, 63, 68, 80, 96, 102, 104, 111, 118, 121, 129, 135, 167].map((n) => `${fmt(MV.B(n))} → ${MV.glitchAt(MV.B(n)).toFixed(2)}`).join(' · ') + '\n';
// Which presentation each run of lyric lines gets, and when each candidate form appears.
md += `\n### 6.5 歌词呈现与候选卡\n\n| 时间 | 歌词行 | 呈现 |\n|---|---|---|\n`;
const NAMES = { term: '终端打字', big: 'CRT 大字', band: '字幕带', kinetic: '满屏动态字（文字 PV A）', hook: '全屏巨字', whisper: '逐词大字（文字 PV B）', stack: '终端堆叠（文字 PV C）' };
const styleOf = (n) => MV.LYRIC_PLAN.find((p) => n >= p.from && n <= p.to).style;
let run = null;
const flush = () => { md += `| ${fmt(run.a)}–${fmt(run.z)} | ${run.from}–${run.to} | ${NAMES[run.st]} |\n`; };
MV.lyrics.forEach((l) => {
  const st = styleOf(l.n);
  if (run && run.st === st) { run.z = l.end; run.to = l.n; return; }
  if (run) flush();
  run = { st, a: l.time, z: l.end, from: l.n, to: l.n };
});
flush();
md += `\n| 时间 | 歌词行 | 候选形态 | 匹配度 |\n|---|---|---|---|\n`;
MV.CANDIDATES.filter((c) => c.form).forEach((c) => {
  const l = MV.lyrics.find((x) => x.n === c.n);
  md += `| ${fmt(l.time)} | ${c.n} | ${c.label} | ${c.match < 0 ? '乱码' : c.match + '%'} |\n`;
});
md += `<!-- timeline:end -->\n`;

const p = path.join(ROOT, 'prompts/01_立绘_GPT-Image.md');
let doc = fs.readFileSync(p, 'utf8');
doc = /<!-- timeline:start/.test(doc) ? doc.replace(/<!-- timeline:start[\s\S]*<!-- timeline:end -->\n?/, () => md) : doc.trimEnd() + '\n\n---\n\n' + md;
fs.writeFileSync(p, doc);
console.log('timeline section written:', MV.SHOTS.length, 'shots');
