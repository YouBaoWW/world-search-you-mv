# 交接文档 · world.search(you); —— 邦妮 × 芬妮 MV

> **v3 历史记录**：以下保留收到交接包时的状态与待办，不能直接视为 v4 的未完成清单。当前修改和验证见 [CHANGELOG_v4.md](CHANGELOG_v4.md)，运行与复现见 [README.md](README.md)。
>

> 版本 v3（2026-10-28）· Remotion 工程 · 成片 1920×1080 / 60fps
> 本文按"拿到就能接着做"来写。所有 **待办** 都标了优先级、位置（`文件:行号`）、问题、改法和验收标准。

---

## 0. 现状一句话

**能出片，还没定稿。** 已经完成：对轨（138.75 BPM，所有切点在小节线上）、接入 74 句歌词、7 章 22 个镜头、从 CRT 到 OLED 的显示器进化、文字 PV、转场、剧情扣歌词。成片 `out/world_search_you_v3_1080p60.mp4`（294.65 秒，音画偏移 0 毫秒）。**主要缺口：6 张 GPT 立绘还是像素头像占位，没有中文字幕。**

---

## 1. 包里有什么

| 路径 | 内容 |
|---|---|
| `HANDOFF.md` | 本文 |
| `STORYBOARD.md` | 剧本、歌曲结构、剧情与歌词逐行对应、22 镜分镜表、文字 PV 分配 |
| `README.md` | 命令速查 |
| `prompts/` | **全部提示词**，入口 `prompts/README.md` |
| `src/` | 源码（见第 3 节） |
| `tools/` | 截图（stills）、音频分析（analyze）、歌词时间（lyric_timing）、歌词合并（lyrics）、立绘与特效时间表（timeline_doc，写入 `prompts/01` 第 6 节） |
| `public/song.mp3` | 音轨（本工程使用的 Mili《world.search(you)》原曲音频） |
| `public/data/song.lrc` | 你提供的歌词 LRC |
| `public/data/*.json` | 分析结果、歌词、歌词时间 |
| `public/avatars/` | wiki 像素头像（原图 200×200 + 还原的 20×20） |
| `public/portraits/` | **空**（只有一个说明文件）：GPT 立绘放这里 |
| `out/review/` | 审片截图（v3 抽帧总览） |
| 成片（单独发送） | `world_search_you_v3_1080p60.mp4`（175 MB），体积大，没有放进 zip |

---

## 2. 快速上手

需要 Node 18+ 和本机 Chrome（路径写在 `remotion.config.js:11`）。

```bash
npm install
```

`package.json` 里的 `allowScripts` 已经放行了 `ffmpeg-static` 和 `esbuild` 的安装脚本（npm 11 起默认会拦截）。如果用旧版 npm 安装后 `node_modules/ffmpeg-static/ffmpeg.exe` 不存在，运行一次 `npm rebuild ffmpeg-static`。

```bash
npm run studio
```
打开 Remotion Studio：拖动时间线，带音频实时预览。

```bash
npm run stills -- --at 42.2,164,212 --sheet out/check.png --cols 3
```
按歌曲时间截图并拼成总览图，改完任何东西先跑这个检查。

```bash
npm run render
```
渲染成片 `out/world_search_you_1080p60.mp4`，本机约 30 分钟。

---

## 3. 架构速览

```
每一帧 t（秒）
 └─ src/MV.jsx            看当前镜头属于哪一层
     ├─ ASCII 层（S01–S12，0:00–2:18）
     │   src/ascii/*.js    canvas 字符引擎：网格 → 场景 → HUD → 显示器（琥珀 / EGA / 特丽珑 / CCFL）
     └─ 现代层（S13–S22，2:18–4:55）
         src/modern/*.jsx  React：场景 + 转场 + 歌词 / 文字 PV + 候选卡 + HUD + 显示器外壳（IPS / OLED）
```

**唯一需要经常改的文件是 `src/ascii/timeline.js`**：
- `B(n)` = 第 n 小节的时间（138.75 BPM，第一拍 0.35 秒）
- `MV.CHAPTERS`（第 15 行起）：章节
- `MV.ERA_SCHEDULE`（第 28 行）：显示器换代时间和转场方式
- `MV.SHOTS`（第 40 行）：22 个镜头的起点、场景、转入方式（`enter`）、镜头内事件时间（`p`）
- `MV.LYRIC_PLAN`（第 71 行）：每句歌词的呈现方式
- `MV.CANDIDATES`（第 87 行）：候选形态卡和匹配度
- `K`（第 121 行）：全片故障强度曲线

所有画面都是 **t 的纯函数**：同一个 t 永远画出同一帧，没有帧间状态，也不用 `Math.random()`。

---

## 4. 待办清单

### P0 · 定稿前必须做

#### P0-1 生成 6 张 GPT 立绘（必须）+ 2 张可选
- **位置**：`public/portraits/`（文件名 = 槽位 ID + `.png`）
- **问题**：S13–S20 的立绘板现在是放大的像素头像，带虚线框和 `ASSET · 槽位ID` 标签
- **改法**：按 `prompts/01_立绘_GPT-Image.md` 生成：F03、B01、B03、B04、F04、B05（必须），F02、P03（可选）。**一定要附官方立绘做参考图。**
- **验收**：`npm run stills -- --at 146,162,180,236,250 --sheet out/p.png --cols 3`。占位标签消失，人物朝向正确，只有黑、白和角色主色三种颜色。

#### P0-2 中文字幕
- **位置**：`public/data/song.lrc` → `node tools/lyrics.mjs public/data/song.lrc`
- **问题**：现在只有英文；参考工程是中英双语
- **改法**：在 LRC 里给每个时间戳再加一行中文（同一个 `[mm:ss.xx]`），重新生成 `lyrics.json`。所有歌词呈现方式都已经支持 `zh` 字段。翻译需要你自己提供或取得授权。
- **验收**：0:20（CRT 字幕带）、2:36（满屏字）、3:30（逐词大字）、4:00（字幕带）四个时间点，中文都正常显示。

#### P0-3 色彩范围（full range → limited range）
- **位置**：`remotion.config.js:3`、`:7`
- **问题**：Remotion 用 JPEG 中间帧，输出是 `yuvj420p`（full range）。本地播放器正常，但 B 站等平台转码后可能偏灰、偏淡。
- **改法（二选一）**：
  1. `Config.setVideoImageFormat('png')`：最稳，渲染慢 20–40%；
  2. 保留 JPEG，用 ffmpeg 把成片转一次：`-vf scale=in_range=full:out_range=tv -pix_fmt yuv420p -color_range tv`。
- **验收**：用 ffprobe 看到 `yuv420p(tv…)`；在目标平台上传一段测试片，确认黑位纯黑、粉色和金色不发灰。

### P1 · 画面问题（审片时发现的）

| # | 镜头 / 时间 | 问题 | 位置 | 建议改法 |
|---|---|---|---|---|
| P1-1 | S04、S05（0:48–1:09） | 候选卡压在右侧数据轨道和 AGENT 006 面板上，有点挤 | `src/ascii/film.js:37`（`candidate()`）、`:40` | 有数据轨道的镜头里，把候选卡放到中间人物下方，或缩窄到 20 列；或者在 `MV.SHOTS` 里加 `candidateAt: 'bottom'` 之类的开关 |
| P1-2 | S21（4:07–4:21） | 代码窗口打字时，行尾有三位乱码在跳（扫描式打字效果），读起来像坏字 | `src/modern/scenes.jsx:262`（`typed(s, t, at, 20)`），函数在 `src/modern/kit.jsx:72` | 代码窗口传 `scramble = 0` 或 `1`：`typed(s, t, at, 20, 1)` |
| P1-3 | S14（2:32–2:46） | 文字 PV A 的大字叠在已压暗的聊天窗口上，局部还是有点花 | `src/MV.jsx:128`（`dim`）；`LYRIC_PLAN` 中 A 段 `dim: 0.72` | 把 A 段 `dim` 提到 0.85，或在 `mirror()`（`src/modern/scenes.jsx:33`）里，文字 PV 期间隐藏聊天窗口 |
| P1-4 | S10（1:49–1:59） | 坑里的花在撞击后约 1 秒才长出来，"花"那句歌词从 1:49.7 就开始了 | `src/ascii/scenes.js:385`（`seg(v, 0.3, 0.75)`） | 改成 `seg(v, 0.12, 0.5)`；或者在撞击前，候选卡里先出现花 |
| P1-5 | 全片现代层 | HUD 角标字号 15px，手机上看不清 | `src/modern/kit.jsx:47` | 改成 18–20px；字幕带已经是 44px，不用动 |
| P1-6 | 2:18.7 前后（S12→S13） | CCFL 液晶 → IPS 交接：canvas 这一侧的"背光"转场只有后半段，前半段没有退出效果 | `src/MV.jsx:49`（`EraShell`）；`src/ascii/display.js` 的 `MV.paint` 转场段 | 在 `display.js` 的 `paint()` 里加一条：`trans.kind === 'backlight' && out` 时整体渐暗 |
| P1-7 | 现代层频谱 | 600×14 的细条太弱，几乎看不到 | `src/MV.jsx:43` | 高度改成 24，或者只在副歌段显示 |
| P1-8 | S14、S18 | 芬妮的点阵虚影现在是从 20×20 像素头像采样的，颗粒很粗 | `src/modern/kit.jsx:204`（`GlyphPortrait`） | P0-1 完成后会自动改用 F03 立绘采样，变精细；之后可以把 `cols` 从 58–60 提到 80 |
| P1-9 | S06（1:09） | 芬妮那半边溶解的时间点（镜头 75% 处）没有卡拍 | `src/ascii/scenes.js` 的 `rivals()`（`seg(u, 0.75, 1)`） | 改成第 45 或 46 小节（在 `MV.SHOTS` 里给 S06 加 `p: { lost: B(45) }`） |

### P2 · 优化（不影响定稿）

| # | 内容 | 位置 | 说明 |
|---|---|---|---|
| P2-1 | **逐词时间轴** | `src/modern/lyrics.jsx:11`（`wordsOf`）、`:16` | 现在每句里的词，是在该句前 75% 时长里均匀分布再吸附到八分音符的。可以用已经装好的 `@remotion/openai-whisper` / whisper.cpp 做强制对齐，拿到真实的逐词时间，砸字会更准 |
| P2-2 | 候选卡换成插画 | `src/modern/lyrics.jsx` 末尾 `CandidateCard` | 现代层的候选卡还是字符画。按 `prompts/02_候选形态插画.md` 生成 8 张三色插画，放到 `public/forms/<form>.png`，有图就用图 |
| P2-3 | 渲染提速 | `src/ascii/display.js:203`（`warp`）、`:207`（`step`） | CRT 曲面每帧做约 1500 次 `drawImage`。可以把 `step` 改成 3–4，或者把曲面改成 WebGL shader；也可以给 `remotion render` 加 `--concurrency`（按 CPU 核数调）。全片现在约 30 分钟 |
| P2-4 | 显示器外壳用插画 | `src/ascii/display.js` 的 `bezel()` | 机壳现在是代码画的。可以按 `prompts/04_特效与显示器外壳.md` 生成五个年代的显示器外壳 PNG（屏幕位置挖空），叠在最上层 |
| P2-5 | 候选匹配度的剧情 | `src/ascii/timeline.js:87` | 0 → 3 → 12 → 41 → ??? → 64 → 88 → 0 这条曲线是剧情设计，可以按你想要的结局调整（比如最后一张直接到 99.7%） |
| P2-6 | 故障曲线 | `src/ascii/timeline.js:121` | 现在在 3:00–3:26 最强。如果觉得结果墙太乱，把 `[B(118), 0.7]` 降到 0.5 |
| P2-7 | 竖屏 / 短视频版 | `src/Root.jsx` | 加一个 1080×1920 的 composition，只取 2:31–3:00（文字 PV A，砸字最密的一段）做短视频 |

---

## 5. 已知问题和坑

1. **Remotion 自带的浏览器在长路径下解压失败** → 已改为使用本机 Chrome（`remotion.config.js:11`，`tools/stills.mjs`）。换电脑时如果 Chrome 不在默认路径，设环境变量 `CHROME_PATH`。
2. **ffmpeg-static 6.0 多线程整片解码会崩溃（exit 139）**，但视频文件本身没问题。用它处理整片时加 `-threads 1`（`tools/analyze.mjs` 已经加了）。
3. **CJK 字体用的是系统里的微软雅黑**，是有意为之：网页字体按 unicode-range 分块加载，canvas 渲染中途可能换字体。在 Mac 上会回退到苹方，字形略有不同。
4. **歌词时间用的是你 LRC 里的时间**（74 句），`public/data/lyric_timing.json`（lrclib 的 71 行时间结构）只作备用。改了 LRC 记得重新运行 `node tools/lyrics.mjs public/data/song.lrc`。
5. **改了时间轴或场景里的事件时间，要同步更新 `tools/timeline_doc.mjs` 里的 `CUES` 表**，然后运行 `node tools/timeline_doc.mjs`，重新生成 `prompts/01` 第 6 节的时间表。
6. **镜头时间都在小节线上**。想挪动镜头，改 `B(n)` 里的 n，不要直接写秒数，否则会脱拍。
7. **v1 工程（canvas + puppeteer）已经停用**，所有工作都在这个 Remotion 工程里。

## 6. 关键决定（为什么这样做）

| 决定 | 原因 |
|---|---|
| 前四章用 canvas 字符引擎，后三章用 React | 字符画需要逐格控制和 CRT 后期效果，现代动态设计需要矢量排版；两者在 2:18.7 显示器换代处衔接 |
| 显示器从 CRT 进化到 OLED | 你的要求；同时也是叙事：搜索越深，屏幕越新 |
| CRT 段用 wiki 像素头像，现代段用 GPT 立绘 | 你的要求；像素头像在琥珀单色屏上被染成荧光色，到 EGA 才显出原色 |
| 剧情 =「芬妮可能变成了任何东西」 | 歌词的骨架就是一连串"如果你变成了 X"；芬妮的设定是爱变装、会解析魔法 |
| 工程不含歌词原文 | 歌词有版权；文字只从你提供的文件读取 |
| 所有时间吸附到小节或八分音符 | 让画面和音乐咬合；改起来也只用改小节号 |

## 7. 发布注意

- 音轨和歌词版权归 Mili，角色版权归《吉星派对》。本片是**非官方同人**，片尾已经写明。
- 发布前看一下 Mili 官方对二次创作的规定；平台投稿时选"转载 / 二创"，并注明原曲出处。
- Remotion 对个人和 3 人以内的团队免费，公司商用需要购买许可。
- `public/song.mp3` 为本工程所用原曲音频，出处见 README；交付工程不代表获得原曲公开分发授权。
