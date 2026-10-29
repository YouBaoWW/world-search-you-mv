# world.search(you); —— 邦妮 × 芬妮 MV v4

Remotion 工程，正式输出 **1920×1080 / 60fps**。前四章使用 Canvas 字符终端与 CRT 后期效果，后三章使用 React 动态排版；显示器从琥珀 CRT 逐步进化到 OLED。保留 v3 的 7 章、22 镜及音乐切点，本版补齐人物立绘、中文字幕并修正画面与导出问题。

![world.search(you); 修正版封面](assets/cover.png)

- 当前修改和验证记录：[CHANGELOG_v4.md](CHANGELOG_v4.md)
- 剧本与分镜：[STORYBOARD.md](STORYBOARD.md)
- v3 历史交接：[HANDOFF.md](HANDOFF.md)（其中的“待办”是 v3 状态）
- v4 视频复现提示词：[REPRODUCTION_PROMPT.zh-CN.txt](docs/REPRODUCTION_PROMPT.zh-CN.txt)
- 全部提示词索引：[prompts/README.md](prompts/README.md)

## 当前版本

- 已接入六张透明人物 PNG：F03、B01、B03、B04、F04、B05；原像素头像继续用于前半段字符画。
- 74 句歌词均有简体中文翻译。原英文、行号、起止时间和词数保持不变；巨字与尾奏堆叠也显示中文。
- 全片启用 **180° 快门角、4 次时间采样**的动态模糊；音轨在采样画面之外，只播放一次。`WorldSearchYou` 的 `motionBlur`、`motionBlurSamples`、`shutterAngle` 属性可用于调节。
- 使用 PNG 中间帧，以 **H.264 / yuv420p / limited range / BT.709** 编码。
- 已完成 v4 整片导出，视频和音频完整解码通过；从母片抽取 14 个时间点生成[审片总览](assets/review-sheet.png)，核验记录见 [CHANGELOG_v4.md](CHANGELOG_v4.md#最终整片核验)。仓库保留源码与素材，成片和渲染中间文件由本地生成。

## 安装与预览

需要 Node.js、npm，以及本机 Chrome 或 Edge。在工程目录运行：

仓库不包含原曲音频。完整预览和渲染前，请将本片使用的同一版本音轨放入 `public/song.mp3`；缺少该文件时只会预览、渲染无声画面。

```bash
npm ci
npm run studio
```

浏览器路径由 `remotion.config.js` 自动检测。也可通过 `CHROME_PATH` 指定可执行文件；无效路径会明确报错。PowerShell 示例：

```powershell
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npm run studio
```

## 渲染

```bash
npm run render
```

输出 `out/world_search_you_v4_1080p60.mp4`，分辨率 1920×1080、60fps；片长根据 `public/song.mp3` 自动计算，约 4 分 55 秒。

```bash
npm run render:draft
```

输出 `out/world_search_you_v4_draft_1080p30.mp4`，分辨率 1920×1080、30fps。动态模糊捕获保持 `scale=1`；需要更小的审片文件时，对导出视频另行缩放。

按歌曲时间截图并拼成总览：

```bash
npm run stills -- --at 20,50,109.9,138.7,146,156,164,212,229,236,250,278 --sheet out/v4_review.png --cols 3
```

## 色彩与音轨检查

下面的命令只渲染 156 秒处的 10 帧，不覆盖正式成片：

```bash
npm exec -- remotion render src/index.js WorldSearchYou out/v4_color_probe.mp4 --frames=9360-9369 --concurrency=1
```

Windows 可使用工程自带的 ffprobe 检查编码；其他平台使用本机 ffprobe：

```powershell
& 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe' -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,color_range,color_space,color_transfer,color_primaries,sample_rate,channels -of json 'out/v4_color_probe.mp4'
```

期望视频为 `1920×1080`、`60/1`、`yuv420p`、`color_range=tv`，色彩空间、传递函数和原色均为 `bt709`，并有 AAC 双声道音轨。此探针已通过，详细结果见变更记录。

## 源码与素材

```text
src/Root.jsx            1080p60 正式 composition、1080p30 审片 composition
src/MV.jsx              每帧调度、音频、频谱、显示器外壳、全片动态模糊
src/ascii/              Canvas 字符引擎与 S01–S12
src/ascii/timeline.js   小节、镜头、显示器、歌词呈现、候选卡、故障曲线
src/modern/kit.jsx      窗口、立绘板、点阵人物、HUD、撕裂
src/modern/scenes.jsx   S13–S22
src/modern/lyrics.jsx   现代层双语歌词与候选卡
public/portraits/       六张已接入的透明人物 PNG
public/avatars/         前半段使用的像素头像
public/song.mp3         需自行放入的原曲音频（Git 忽略）
public/data/song.lrc    保留原英文时间轴并追加同时间戳中文
public/data/lyrics.json 引擎使用的 74 句双语歌词
assets/cover.png        已修正手部的成片封面
assets/review-sheet.png 成片抽帧总览
docs/REPRODUCTION_PROMPT.zh-CN.txt 依据当前实现整理的复现提示词
tools/stills.mjs        定时截图和总览图
```

改动 LRC 后运行 `npm run lyrics`。改动时间轴或场景事件时间时，同步更新 `tools/timeline_doc.mjs` 的 `CUES`，再运行 `npm run timeline-doc` 更新立绘和特效时间表。切点仍以 `B(n)` 小节函数表示，避免直接挪动秒数而脱拍。

## 音轨与出处

音频沿用交接包中的 Mili《world.search(you)》。用户提供的原曲视频出处为 [哔哩哔哩 BV1Ps411u7ZX](https://www.bilibili.com/video/BV1Ps411u7ZX)。LRC 中的署名为作词 momocashew、作曲 momocashew / Yamato Kasai。本工程不对用户是否购买音轨作出断言。

字符终端视觉参考 [world.execute-me-ascii](https://github.com/yym8224961/world.execute-me-ascii)，现代段沿用交接包记录的 NancyLu PV 方向。角色来源为《吉星派对》，本片为非官方同人创作。原曲、歌词和角色的权利归其相应权利人；交付工程不代表获得原曲公开分发授权。


> v4 捕获兼容：开启 HTML-in-canvas 动态模糊时，正式渲染与草稿均保持 `scale=1`。部分 Chrome 版本在低 DPR 下捕获嵌套 Canvas 会裁切；`tools/stills.mjs` 已按完整画幅捕获后缩图。需要小尺寸视频时，请对导出的完整画幅视频再缩放。


## 最终整片核验

已完成 v4 整片导出：1920×1080、60fps、H.264、yuv420p、BT.709 limited range、AAC 双声道。视频与音频均完整解码通过，未发现解码错误；对导出母片抽取 14 个时间点生成[审片总览](assets/review-sheet.png)。全片动态模糊默认 180° 快门、4 次子帧采样。核验说明见 [CHANGELOG_v4.md](CHANGELOG_v4.md#最终整片核验)；本仓库不提交 `out/` 渲染产物。
