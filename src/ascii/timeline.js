/* One timeline for both layers, aligned to public/song.mp3.
   Grid from tools/analyze.mjs: 138.75 BPM, first beat 0.35 s, downbeat on beat 0.
   Every cut is a bar line B(n); events inside a shot are bar or beat times in `p`. */
(function () {
  const MV = (window.MV = window.MV || {});

  MV.DURATION = 294.64;
  MV.BPM = 138.75;
  MV.BEAT0 = 0.35;
  MV.TITLE = 'WORLD.SEARCH(YOU);';
  const BAR = (4 * 60) / MV.BPM;
  const B = (MV.B = (n) => +(MV.BEAT0 + n * BAR).toFixed(3));   // bar n downbeat

  // Song sections (bar numbers) as measured: 0 intro stabs · 8 build · 24 full · 40 break ·
  // 48 full · 56 stops · 63 chorus · 80 break · 88 full · 96 stops · 103 loudest · 119 bass-only
  // breakdown · 135 final chorus (largest change) · 151 break · 155 outro · 167 tail.
  MV.CHAPTERS = [
    { at: 0,      en: '01 / CASE OPEN',   zh: '立案' },
    { at: B(28),  en: '02 / DOSSIER',     zh: '卷宗' },
    { at: B(48),  en: '03 / SEARCH',      zh: '搜索' },
    { at: B(63),  en: '04 / THE FALL',    zh: '天王落' },
    { at: B(80),  en: '05 / ANALYSIS',    zh: '解析' },
    { at: B(103), en: '06 / DEEP SEARCH', zh: '深层检索' },
    { at: B(135), en: '07 / CASE ???',    zh: '结案？' },
  ];

  // Display hardware. ASCII layer draws crt-* and lcd-ccfl, React draws lcd-ips and oled.
  MV.ERA_SCHEDULE = [
    { at: 0,      era: 'crt-amber' },
    { at: B(28),  era: 'crt-ega',   kind: 'degauss',   dur: 1.4 },
    { at: B(48),  era: 'crt-color', kind: 'crtOff',    dur: 1.6 },
    { at: B(63),  era: 'lcd-ccfl',  kind: 'crtOff',    dur: 2.0 },
    { at: B(80),  era: 'lcd-ips',   kind: 'backlight', dur: 1.4 },
    { at: B(103), era: 'oled',      kind: 'oledWake',  dur: 2.4 },
  ];

  // log/logZh: the case-log caption (original copy, not lyrics).
  // pace: ASCII scenes written for a different length play their beats at e * pace.
  // p: song times of events inside the shot.
  MV.SHOTS = [
    { id: 'S01', at: 0,      layer: 'ascii',  scene: 'boot',       pace: 0.5,  log: 'TERMINAL 006 · POWER ON SELF TEST', logZh: '终端 006 · 开机自检' },
    { id: 'S02', at: B(8),   layer: 'ascii',  scene: 'casefile',   pace: 0.5,  log: 'LOADING CASE FILE #007', logZh: '调取卷宗 #007' },
    { id: 'S03', at: B(16),  layer: 'ascii',  scene: 'query',      hud: false, log: '> world.search(you);', logZh: '检索指令已发出',
      p: { type: B(17), enter: B(21) + 2 * BAR / 4, scramble: B(22), lock: B(24), fall: B(28) - 1.3 } },
    { id: 'S04', at: B(28),  layer: 'ascii',  scene: 'bonnie',     log: 'AGENT 006 · BONNIE · ONLINE', logZh: '侦探 006 · 邦妮 · 在线' },
    { id: 'S05', at: B(34),  layer: 'ascii',  scene: 'fanny',      pace: 1.3,  log: 'AGENT 007 · FANNY · NO RESPONSE', logZh: '侦探 007 · 芬妮 · 无应答' },
    { id: 'S06', at: B(40),  layer: 'ascii',  scene: 'rivals',     log: 'SAME CLASS · SAME RANK · NEVER GOT ALONG', logZh: '同届 · 齐名 · 性格不合' },
    { id: 'S07', at: B(48),  layer: 'ascii',  scene: 'cityscan',   pace: 1.6,  log: 'CITY-WIDE SEARCH · 0 RESULTS', logZh: '全城检索 · 0 结果' },
    { id: 'S08', at: B(52),  layer: 'ascii',  scene: 'marks',      log: 'COVERT ACTION · 3 CLUES MARKED', logZh: '隐匿行动 · 标记 3 条线索' },
    { id: 'S09', at: B(56),  layer: 'ascii',  scene: 'trail',      log: 'FOOTPRINTS LEAD TO THE IMPACT ZONE', logZh: '足迹指向天王落' },
    { id: 'S10', at: B(63),  layer: 'ascii',  scene: 'starfall',   log: 'THE NIGHT OF THE FALL', logZh: '天王落之夜', p: { impact: B(67) } },
    { id: 'S11', at: B(69),  layer: 'ascii',  scene: 'lastphoto',  log: 'RECOVERING THE LAST PHOTO', logZh: '恢复最后一张照片' },
    { id: 'S12', at: B(74),  layer: 'ascii',  scene: 'signallost', log: 'SIGNAL LOST', logZh: '信号丢失', p: { flat: B(77) } },
    { id: 'S13', at: B(80),  layer: 'modern', scene: 'triad',      log: 'SEARCH, PARSE, CONFIRM!', logZh: '搜索，解析，确定！', p: { slams: [B(80), B(83), B(86)] } },
    { id: 'S14', enter: 'wipe', at: B(88),  layer: 'modern', scene: 'mirror',     log: 'ECHO', logZh: '回声' },
    { id: 'S15', enter: 'glitch', at: B(96),  layer: 'modern', scene: 'firewall',   log: 'BY ANY MEANS', logZh: '不择手段', p: { hits: [B(97), B(98), B(99), B(100), B(101)] } },
    { id: 'S16', at: B(103), layer: 'modern', scene: 'recursion',  log: 'RECURSIVE SEARCH', logZh: '递归检索' },
    { id: 'S17', enter: 'zoom', at: B(111), layer: 'modern', scene: 'flood',      log: '4096 RESULTS · 0 MATCH', logZh: '4096 个结果 · 0 匹配' },
    { id: 'S18', enter: 'flash', at: B(119), layer: 'modern', scene: 'onematch',   log: 'ONE SIGNAL LEFT', logZh: '唯一信号' },
    { id: 'S19', enter: 'wipe', at: B(129), layer: 'modern', scene: 'boundary',   log: 'THE BOUNDARY', logZh: '边界', p: { cross: [B(132), B(135) - 0.1] } },
    { id: 'S20', at: B(135), layer: 'modern', scene: 'calm',       log: 'THE MAGNIFIER STAYED', logZh: '放大镜还在' },
    { id: 'S21', enter: 'type', at: B(143), layer: 'modern', scene: 'returnyou',  log: 'return you;', logZh: '返回' },
    { id: 'S22', enter: 'glitch', at: B(151), layer: 'modern', scene: 'ending',     log: 'CASE #007 · OPEN', logZh: '未完待续',
      p: { type: B(152), enter: B(155), result: B(156), out: B(167), credits: B(168) } },
  ];

  // How each sung line is shown (line numbers n from public/data/lyrics.json: 74 lines, your LRC).
  // term = typed in the ASCII HUD band · big = block letters on the CRT · band = caption band ·
  // kinetic / hook / whisper / stack = text-PV. dim: how far the picture recedes for that block.
  // First match wins, so single lines are listed before the ranges that contain them.
  MV.LYRIC_PLAN = [
    { from: 13, to: 13, style: 'big' },                                  // the first "searching" tag, before the break
    { from: 32, to: 32, style: 'big' },                                  // the second one, before the next break
    { from: 1,  to: 32, style: 'term' },                                 // CRT / LCD chapters
    { from: 38, to: 38, style: 'hook',    accent: 'bonnie', dim: 0.6 },  // the first forgotten word
    { from: 44, to: 44, style: 'hook',    accent: 'bonnie', dim: 0.6 },  // the second, on the firewall breach
    { from: 33, to: 43, style: 'kinetic', accent: 'bonnie', dim: 0.85 }, // text-PV A: groping for the word
    { from: 45, to: 55, style: 'band' },                                 // searching everywhere: picture leads
    { from: 56, to: 59, style: 'whisper', accent: 'fanny',  dim: 0.82 }, // text-PV B: the bass-only breakdown
    { from: 68, to: 68, style: 'hook',    accent: 'sys',    dim: 0.6 },  // the last "searching"
    { from: 60, to: 67, style: 'band' },                                 // final chorus
    { from: 69, to: 74, style: 'stack',   accent: 'sys',    dim: 0.35 }, // text-PV C: the outro as her last queries
  ];

  // Each "if you turned into ..." line is a form Bonnie tests. The card shows from that line
  // until the next form. Match climbs as the forms come closer to a person, then drops again.
  MV.CANDIDATES = [
    { n: 5,  form: 'table',    label: 'TABLE',    match: 0 },
    { n: 9,  form: 'eggplant', label: 'EGGPLANT', match: 0 },
    { n: 14, form: 'cat',      label: 'CAT · BLUEPOINT', match: 3 },
    { n: 20, form: 'steak',    label: 'STEAK',    match: 0 },
    { n: 24, form: 'flower',   label: 'FLOWER',   match: 12 },
    { n: 28, form: 'human',    label: 'HUMAN',    match: 41 },
    { n: 33, form: 'piece',    label: 'A PIECE OF ????', match: -1 },
    { n: 45, form: null },                                               // searching everywhere: no single form
    { n: 60, form: 'flower',   label: 'FLOWER',   match: 64 },
    { n: 64, form: 'human',    label: 'HUMAN',    match: 88 },
    { n: 68, form: null },
    { n: 69, form: 'dog',      label: 'DOG',      match: 0 },
    { n: 72, form: 'tomato',   label: 'TOMATO',   match: 0 },
  ];
  MV.candidateAt = (t) => {
    const L = MV.lyrics || [];
    let hit = null;
    MV.CANDIDATES.forEach((c, i) => {
      const a = L.find((l) => l.n === c.n), nx = MV.CANDIDATES[i + 1], b = nx && L.find((l) => l.n === nx.n);
      if (a && t >= a.time && t < (b ? b.time : a.time + 14)) hit = { ...c, t0: a.time };
    });
    return hit && hit.form ? hit : null;
  };

  MV.shotIndex = (t) => { let k = 0; MV.SHOTS.forEach((s, i) => { if (t >= s.at) k = i; }); return k; };
  MV.shotAt = (t) => {
    const k = MV.shotIndex(t), s = MV.SHOTS[k], n = MV.SHOTS[k + 1];
    const d = (n ? n.at : MV.DURATION) - s.at;
    return { shot: s, e: t - s.at, d, u: (t - s.at) / d };
  };

  // Damage accumulates while she is missing, peaks with the loudest stretch, and drains
  // through the bass-only breakdown; the final chorus is clean.
  const K = [[0, 0.03], [B(63), 0.05], [B(68), 0.25], [B(80), 0.3], [B(96), 0.45], [B(102), 0.8], [B(103) + 0.6, 0.2],
             [B(111), 0.55], [B(118), 0.7], [B(121), 0.3], [B(129), 0.2], [B(135), 0.03], [MV.DURATION, 0]];
  MV.glitchAt = function (t) {
    for (let i = 1; i < K.length; i++) if (t < K[i][0]) return MV.mix(K[i - 1][1], K[i][1], (t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]));
    return 0;
  };
})();
