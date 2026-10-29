// Shots S13-S22 (IPS -> OLED). Each scene: ({ t, e, d, u, pulse, beat }) => JSX.
// t is song time, e time into the shot, u = e / d.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { SpritePre, planFor } from './lyrics.jsx';
import { C, MONO, SANS, CJK, clamp, seg, easeOut, easeInOut, hash, blink, typed, Cursor, Slam, Win, SpeedLines, WireGlobe, Plate, GlyphPortrait, hasFile } from './kit.jsx';

const FORMS = ['table', 'eggplant', 'cat', 'steak', 'flower', 'dog', 'tomato', 'piece'];

const Line = ({ children, color = C.ink, size }) => <div style={{ color, fontSize: size, whiteSpace: 'pre' }}>{children}</div>;

// ---------------- 05 ANALYSIS · IPS ----------------
function triad({ t, e, d, shot }) {
  // Each word lands on its own bar (shot.p.slams).
  const sl = shot.p.slams, i = t >= sl[2] ? 2 : t >= sl[1] ? 1 : 0, at = (k) => sl[k];
  const W = [['SEARCH,', '搜索'], ['PARSE,', '解析'], ['CONFIRM!', '确定']];
  const hit = t - sl[i];
  return (
    <AbsoluteFill>
      {hit < 1.2 && <SpeedLines cx={1350} cy={520} t={t} color={C.ink} alpha={0.55 * (1 - hit / 1.2)} seed={i + 3} />}
      <Plate slot="F03_fanny_echo" who="fanny" x={1080} y={110} w={760} h={900} t={t} enter={t - e + 0.1} accent={C.fanny} />
      <Win x={110} y={150} w={700} h={330} t={t} enter={t - e} title="Fanny / echo.log" accent={C.fanny} foot="memory of agent 007 · replaying">
        <Line color={C.dim} size={18}>{`// recovered voice line`}</Line>
        {W.map(([w], k) => k <= i && <Line key={k}>{'> ' + typed(w.toLowerCase(), t, at(k), 18)}{k === i && <Cursor t={t} />}</Line>)}
        {i === 2 && hit > 1.2 && <Line color={C.fanny} size={24}><span style={{ fontFamily: CJK }}>{typed('「搜索，解析，确定！」', t, at(2) + 1.2, 10, 1)}</span></Line>}
      </Win>
      <div style={{ position: 'absolute', left: 110, top: 600, fontFamily: CJK, fontSize: 44, color: C.fanny, letterSpacing: 8, opacity: easeOut(hit * 3) }}>{W[i][1]}</div>
      <Slam key={i} text={W[i][0]} t={t} at={at(i)} x={100} y={680} size={200} plate={C.fanny} />
    </AbsoluteFill>
  );
}

function mirror({ t, e, d, u }) {
  const S = t - e;
  // Leave the text-PV frame clear while its lyric block is on screen.
  const pv = (window.MV.lyrics || []).filter((l) => l.time < S + d && l.end > S && ['kinetic', 'hook'].includes(planFor(l.n).style));
  const a = pv[0]?.time, z = pv[pv.length - 1]?.end;
  const chatOpacity = pv.length ? 1 - seg(t, a - 0.25, a) * (1 - seg(t, z, z + 0.25)) : 1;
  const msgs = [
    [0.05, 'sys', '宿舍 · 老鼠 · 差点烧掉整栋楼'],
    [0.2, '006', '暴力女！'],
    [0.34, '007', '捣蛋鬼。'],
    [0.5, 'sys', '学号 006 / 007 · 同届 · 齐名'],
    [0.7, '006', '……你去哪了？'],
  ];
  const sep = Math.sin(t * 2) * 6;
  return (
    <AbsoluteFill>
      <Plate slot="B01_bonnie_profile" who="bonnie" x={40} y={120} w={640} h={900} t={t} enter={S} accent={C.bonnie} flipBand from="left" />
      <GlyphPortrait slot="F03_fanny_echo" who="fanny" x={1240} y={130 + sep} w={640} h={880} t={t} density={0.55 + 0.25 * Math.sin(t * 3) ** 2} cols={80} />
      <div style={{ position: 'absolute', left: 959, top: 80, bottom: 80, width: 2, backgroundImage: `linear-gradient(${C.dim} 50%, transparent 50%)`, backgroundSize: '2px 14px', opacity: 0.5 }} />
      <AbsoluteFill style={{ opacity: chatOpacity }}>
      <Win x={660} y={170} w={600} h={700} t={t} enter={S + 0.2} title="006 ⇄ 007 / memory.chat" accent={C.bonnie} status={u > 0.85 ? 'UNREAD' : 'STREAMING'} progress={u}>
        {msgs.map(([at, who, s], k) => {
          if (u < at) return null;
          const v = easeOut((u - at) * d * 3);
          if (who === 'sys') return <div key={k} style={{ textAlign: 'center', color: C.dim, fontSize: 16, fontFamily: CJK, margin: '10px 0', opacity: v }}>— {s} —</div>;
          const me = who === '006';
          return (
            <div key={k} style={{ display: 'flex', justifyContent: me ? 'flex-start' : 'flex-end', margin: '12px 0', opacity: v, transform: `translateY(${(1 - v) * 14}px)` }}>
              <div style={{ maxWidth: 380, padding: '10px 16px', fontFamily: CJK, fontSize: 24, color: me ? '#fff' : '#111', background: me ? C.bonnie : C.fanny, borderRadius: me ? '4px 16px 16px 16px' : '16px 4px 16px 16px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, opacity: 0.7, marginBottom: 2 }}>{me ? 'AGENT 006' : 'AGENT 007'}</div>
                {s}
              </div>
            </div>
          );
        })}
        {u > 0.82 && <div style={{ fontFamily: MONO, fontSize: 13, color: C.dim, marginTop: 4 }}>delivered · {blink(t, 1) ? 'not read' : ''}</div>}
      </Win>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function firewall({ t, e, d, u, shot }) {
  // Five apples, five stops: each hit is a bar line from the timeline.
  const S = t - e, n = 5, hitAt = (i) => shot.p.hits[i], launch = 0.55;
  const broken = Array.from({ length: n }, (_, i) => t >= hitAt(i)).filter(Boolean).length;
  const granted = broken === n && t > hitAt(n - 1) + 0.4;
  const hand = [420, 640];
  return (
    <AbsoluteFill>
      <Plate slot="B03_bonnie_throw" who="bonnie" x={40} y={400} w={560} h={640} t={t} enter={S} accent={C.bonnie} flipBand from="left" />
      {Array.from({ length: n }, (_, i) => {
        const x = 900 + i * 150, y = 200 + i * 70, hb = hitAt(i), k = seg(t, hb, hb + 0.8);
        if (k >= 1) return null;
        return (
          <div key={i} style={{ position: 'absolute', left: 0, top: 0 }}>
            {Array.from({ length: k > 0 ? 6 : 1 }, (_, s) => {
              const dy = k > 0 ? (s - 2.5) * 20 * k : 0, dx = k > 0 ? (hash(s * 7 + i) - 0.3) * 600 * easeOut(k) : 0, rot = k > 0 ? (hash(s + i * 3) - 0.5) * 40 * k : 0;
              return (
                <div key={s} style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - k, clipPath: k > 0 ? `inset(${(s / 6) * 100}% 0 ${100 - ((s + 1) / 6) * 100}% 0)` : 'none',
                  transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` }}>
                  <Win x={x} y={y} w={560} h={300} t={t} enter={S + i * 0.12} title={`FIREWALL L${i + 1}`} status="403" accent={C.err} foot="request rejected · owner mismatch" progress={1}>
                    <Line color={C.dim} size={18}>{'request.owner("FANNY");'}</Line>
                    <Line color={C.err}>{'E_ACCESS / 403'}</Line>
                    <Line size={18}>{'permission: DENIED'}</Line>
                  </Win>
                </div>
              );
            })}
          </div>
        );
      })}
      {Array.from({ length: n }, (_, i) => {
        const hb = hitAt(i), v = seg(t, hb - launch, hb);
        if (v <= 0 || v >= 1) return null;
        const tx = 1180 + i * 150, ty = 350 + i * 70;
        const x = hand[0] + (tx - hand[0]) * v, y = hand[1] + (ty - hand[1]) * v - Math.sin(v * Math.PI) * 260;
        return (
          <svg key={i} width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle cx={x} cy={y} r={26} fill={C.err} /><circle cx={x - 8} cy={y - 8} r={7} fill="#fff" opacity={0.6} />
            <path d={`M${x} ${y - 26} q 6 -14 16 -18`} stroke="#7fdc6a" strokeWidth={5} fill="none" />
            {Array.from({ length: 6 }, (_, s) => <circle key={s} cx={x + 16 + hash(s + Math.floor(t * 30)) * 14} cy={y - 44 - hash(s * 3 + Math.floor(t * 30)) * 14} r={3} fill="#ffe066" />)}
          </svg>
        );
      })}
      {granted
        ? <><Slam text="ACCESS" t={t} at={hitAt(n - 1) + 0.4} x={100} y={90} size={120} plate={C.sys} /><Slam text="GRANTED" t={t} at={hitAt(n - 1) + 0.55} x={100} y={210} size={120} color={C.sys} plate={C.ink} /></>
        : <><Slam text="PERMISSION" t={t} at={S + 0.1} x={100} y={90} size={120} plate={C.bonnie} /><Slam text="DENIED" t={t} at={S + 0.3} x={100} y={210} size={120} color={C.bonnie} plate={C.ink} /></>}
      <div style={{ position: 'absolute', left: 106, top: 345, fontFamily: MONO, fontSize: 18, color: C.dim }}>FIREWALL {broken}/{n} · APPLE.STOCK = {12 - broken}</div>
    </AbsoluteFill>
  );
}

// ---------------- 06 DEEP SEARCH · OLED ----------------
function recursion({ t, e, pulse }) {
  const z = e * 0.5, fr = z - Math.floor(z), boxes = [];
  for (let i = 9; i >= 0; i--) {
    const s = Math.pow(0.6, i - fr), w = 1640 * s, h = 860 * s;
    if (w < 40 || w > 4000) continue;
    boxes.push(
      <div key={i} style={{ position: 'absolute', left: 960 - w / 2, top: 540 - h / 2, width: w, height: h, border: `${Math.max(1, 2 * s)}px solid ${i % 2 ? C.sys : C.ink}`, opacity: clamp(1.2 - s * 0.5) }}>
        {w > 220 && <div style={{ position: 'absolute', left: 10 * s + 6, top: 8 * s + 4, fontFamily: MONO, fontSize: Math.max(10, 30 * s), color: C.sys }}>search(</div>}
        {w > 220 && <div style={{ position: 'absolute', right: 10 * s + 6, bottom: 8 * s + 4, fontFamily: MONO, fontSize: Math.max(10, 30 * s), color: C.sys }}>)</div>}
      </div>
    );
  }
  return (
    <AbsoluteFill>
      {boxes}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 70 + pulse * 20, color: C.fanny }}>you</div>
      <div style={{ position: 'absolute', left: 64, top: 96, fontFamily: MONO, fontSize: 18, color: C.sys }}>DEPTH {String(Math.floor(z) + 1).padStart(4, '0')} · STACK {(Math.floor(z) * 4096 + 512).toLocaleString()} B</div>
    </AbsoluteFill>
  );
}

function flood({ t, e, d, u }) {
  const cols = 16, rows = 8, N = cols * rows, cw = 108, ch = 104, x0 = (1920 - cols * cw) / 2 + 4, y0 = 200;
  const fill = Math.floor(seg(u, 0, 0.3) * N), sweep = seg(u, 0.25, 0.95) * N, total = Math.floor(seg(u, 0, 0.3) * 4096);
  const scroll = (e * 26) % ch;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 64, top: 92, fontFamily: MONO, fontSize: 20, color: C.dim, letterSpacing: 2 }}>RESULTS</div>
      <div style={{ position: 'absolute', left: 60, top: 112, fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.ink }}>{String(total).padStart(4, '0')}</div>
      <div style={{ position: 'absolute', left: 330, top: 112, fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.err }}>MATCH 0</div>
      <div style={{ position: 'absolute', left: x0, top: y0, width: cols * cw, height: rows * ch, overflow: 'hidden' }}>
        {Array.from({ length: fill }, (_, i) => {
          const c = i % cols, r = Math.floor(i / cols), bad = i < sweep, cur = Math.floor(sweep) === i;
          return (
            <div key={i} style={{ position: 'absolute', left: c * cw, top: r * ch - scroll, width: cw - 8, height: ch - 8, border: `1px solid ${cur ? C.err : C.faint}`, background: 'rgba(15,20,30,0.9)', opacity: bad && !cur ? 0.45 : 1 }}>
              {/* She shows up in most everything: some results are her, the rest are the forms she might have become. */}
              {hash(i * 3 + 1) < 0.4
                ? <Img src={staticFile('avatars/fanny_px20.png')} style={{ position: 'absolute', left: 22, top: 6, width: 52, imageRendering: 'pixelated', filter: bad ? `grayscale(1) brightness(${0.5 + hash(i) * 0.3})` : `hue-rotate(${(hash(i) - 0.5) * 90}deg)` }} />
                : <div style={{ position: 'absolute', left: 6, top: 6, transform: 'scale(0.42)', transformOrigin: 'top left', filter: bad ? 'grayscale(1) brightness(0.6)' : 'none' }}>
                    <SpritePre form={FORMS[Math.floor(hash(i * 7 + 2) * FORMS.length)]} size={14} />
                  </div>}
              <div style={{ position: 'absolute', left: 6, bottom: 4, fontFamily: MONO, fontSize: 11, color: C.dim }}>#{String(i * 31 % 4096).padStart(4, '0')}</div>
              {bad && <div style={{ position: 'absolute', left: -6, top: 36, transform: 'rotate(-18deg)', fontFamily: SANS, fontWeight: 900, fontSize: 18, color: C.err, border: `2px solid ${C.err}`, padding: '0 4px', background: 'rgba(0,0,0,0.6)' }}>MISMATCH</div>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function onematch({ t, e, d, u, beat }) {
  const k = seg(u, 0.1, 0.6), pct = Math.min(99.7, seg(u, 0.15, 0.7) * 99.7);
  const pts = Array.from({ length: 160 }, (_, i) => {
    const x = 80 + i * 11, p = beat - (160 - i) * 0.02, ph = ((p % 1) + 1) % 1;
    const v = ph < 0.08 ? Math.sin(ph / 0.08 * Math.PI) * 0.15 : ph < 0.12 ? -0.15 : ph < 0.16 ? 1 : ph < 0.2 ? -0.35 : ph < 0.36 ? Math.sin((ph - 0.2) / 0.16 * Math.PI) * 0.25 : 0;
    return `${i ? 'L' : 'M'}${x},${930 - v * 90 * seg(u, 0.2, 0.45)}`;
  }).join('');
  return (
    <AbsoluteFill>
      <WireGlobe cx={560} cy={480} r={300} t={t} ping={{ lat: 0.35, lon: 1.2, color: C.fanny }} label="SIGNAL · 007" />
      <GlyphPortrait slot="F03_fanny_echo" who="fanny" x={1180} y={140} w={620} h={760} t={t} density={0.15 + k * 0.75} cols={80} flicker={0.4 - k * 0.3} />
      <div style={{ position: 'absolute', right: 120, top: 210, textAlign: 'right' }}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, letterSpacing: 4 }}>MATCH</div>
        <div style={{ fontFamily: MONO, fontSize: 150, color: pct >= 99.7 ? C.fanny : C.sys, lineHeight: 1 }}>{pct.toFixed(1)}<span style={{ fontSize: 70 }}>%</span>{pct >= 99.7 && blink(t, 2) ? '▍' : ''}</div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={pts} stroke={C.fanny} strokeWidth={3} fill="none" opacity={0.9} />
      </svg>
    </AbsoluteFill>
  );
}

function boundary({ t, e, d, u, shot }) {
  // The magnifier crosses during the build and is through on the final chorus's downbeat.
  const [c0, c1] = shot.p.cross, near = easeOut(seg(u, 0.05, 0.6)), m = seg(t, c0, c1);
  const rip = Math.exp(-Math.pow((t - (c0 + c1) / 2) * 1.4, 2));
  const path = Array.from({ length: 60 }, (_, i) => `${i ? 'L' : 'M'}${960 + Math.sin(i * 0.5 - t * 7) * (3 + rip * 22)},${80 + i * 16}`).join('');
  return (
    <AbsoluteFill>
      <Plate slot="B04_bonnie_reach" who="bonnie" x={140 + near * 120} y={160} w={620} h={860} t={t} enter={t - e} accent={C.bonnie} flipBand from="left" />
      <Plate slot="F04_fanny_reach" who="fanny" x={1160 - near * 120} y={160} w={620} h={860} t={t} enter={t - e + 0.2} accent={C.fanny} dim={0.35 * (1 - near)} />
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={path} stroke="#fff" strokeWidth={4} fill="none" style={{ filter: 'drop-shadow(0 0 12px #fff) drop-shadow(0 0 30px #4fc3ff)' }} />
        {m > 0 && m < 1 && (() => {
          const x = 1260 - easeInOut(m) * 600, y = 470;
          return <g transform={`translate(${x} ${y}) rotate(${-20 + m * 40})`}>
            <circle r={46} fill="rgba(200,240,255,0.15)" stroke="#d9b36b" strokeWidth={10} />
            <rect x={30} y={30} width={18} height={90} rx={6} transform="rotate(-45)" fill="#6b4a2b" />
            <circle r={46} fill="none" stroke="#fff" strokeWidth={2} opacity={0.6} />
          </g>;
        })()}
      </svg>
      <Win x={660} y={880} w={600} h={150} t={t} enter={t - e + 0.6} title="world / connect" accent={C.sys} progress={u}>
        <Line>{typed('world.connect(006, 007);', t, t - e + 1.0, 14)}<Cursor t={t} /></Line>
      </Win>
    </AbsoluteFill>
  );
}

// ---------------- 07 CASE ??? ----------------
function calm({ t, e, d }) {
  const white = Math.max(0, 1 - e / 1.8);
  return (
    <AbsoluteFill>
      <Plate slot="B05_bonnie_magnifier" who="bonnie" x={160} y={140} w={680} h={880} t={t} enter={t - e + 0.6} accent={C.bonnie} flipBand from="left" />
      <div style={{ position: 'absolute', left: 1160, top: 380 }}>
        {hasCake() ? <Img src={staticFile('portraits/P03_strawberry_cake.png')} style={{ width: 460 }} /> : <Cake t={t} />}
      </div>
      <div style={{ position: 'absolute', left: 1240, top: 800, fontFamily: SANS, fontWeight: 900, fontSize: 80, color: C.fanny, opacity: easeOut(seg(e, 3, 4)) }}>02 / 17</div>
      <Win x={1100} y={130} w={620} h={200} t={t} enter={t - e + 2} title="Bonnie / note.txt" status="LOCAL" accent={C.bonnie}>
        <Line><span style={{ fontFamily: CJK }}>{typed('她的放大镜，我先替她收着。', t, t - e + 2.6, 8, 1)}</span><Cursor t={t} /></Line>
      </Win>
      <AbsoluteFill style={{ background: '#fff', opacity: white }} />
    </AbsoluteFill>
  );
}
const hasCake = () => hasFile('portraits/P03_strawberry_cake.png');
const Cake = ({ t }) => (
  <svg width={460} height={380}>
    <rect x={60} y={170} width={340} height={170} rx={20} fill="#fff" />
    <rect x={60} y={170} width={340} height={40} rx={20} fill="#ffe0ea" />
    {[110, 180, 250, 320].map((x) => <g key={x}><circle cx={x} cy={165} r={24} fill={C.err} /><path d={`M${x - 8} ${142} l8 -10 l8 10`} fill="#7fdc6a" /></g>)}
    <rect x={222} y={90} width={16} height={60} fill="#ffd0e6" />
    <ellipse cx={230} cy={80 + Math.sin(t * 9) * 2} rx={9} ry={16 + Math.sin(t * 13) * 2} fill="#ffcf4a" />
  </svg>
);

function returnyou({ t, e, d, u }) {
  const S = t - e;
  const code = [['// case #007', C.dim], ['Person you = null;', C.ink], ['', C.ink], ['while (you == null) {', C.sys], ['    you = world.search(you);', C.fanny], ['}', C.sys], ['', C.ink], ['return you;', C.bonnie]];
  let acc = 0;
  const settled = u > 0.88, state = settled ? 'OPEN' : u > 0.62 ? (hash(Math.floor(t * 10)) > 0.5 ? 'OPEN' : 'CLOSED') : 'CLOSED';
  return (
    <AbsoluteFill>
      <Win x={260} y={150} w={1000} h={640} t={t} enter={S} title="Bonnie / case007.java" accent={C.sys} progress={u}>
        {code.map(([s, col], i) => {
          const at = S + 0.5 + acc / 20; acc += s.length + 6;
          return (
            <div key={i} style={{ display: 'flex', fontSize: 30, lineHeight: 1.7 }}>
              <span style={{ width: 50, color: C.faint }}>{t > at ? i + 1 : ''}</span>
              <span style={{ color: col, whiteSpace: 'pre' }}>{typed(s, t, at, 20, 0)}</span>
            </div>
          );
        })}
      </Win>
      <Win x={1300} y={150} w={480} h={300} t={t} enter={S + d * 0.45} title="stdout" status="EXIT 0" accent={C.fanny}>
        <Line color={C.fanny}>{typed('RESULT: 1 MATCH', t, S + d * 0.5, 18)}</Line>
        <Line color={C.dim} size={18}>{typed('(UNVERIFIED)', t, S + d * 0.55, 18)}</Line>
      </Win>
      {u > 0.6 && (
        <div style={{ position: 'absolute', left: 1300, top: 500, fontFamily: MONO }}>
          <div style={{ fontSize: 16, color: C.dim, letterSpacing: 3, marginBottom: 12 }}>CASE #007 STATUS</div>
          <div style={{ display: 'flex', border: `1px solid ${C.faint}`, width: 480 }}>
            {['CLOSED', 'OPEN'].map((s) => <div key={s} style={{ flex: 1, padding: '18px 0', textAlign: 'center', fontSize: 30, fontWeight: 700, color: state === s ? '#111' : C.dim, background: state === s ? (s === 'OPEN' ? C.bonnie : C.dim) : 'transparent' }}>{s}</div>)}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// Break: the search box is typed again. Outro: one result comes back (her, unverified),
// the pointer hovers it. Tail: everything goes, the credits stay.
function ending({ t, shot }) {
  const P = shot.p, out = seg(t, P.out, P.out + 1.2), loading = t >= P.enter && t < P.result;
  const lift = easeOut(seg(t, P.enter, P.enter + 0.6)) * 170;
  const card = easeOut(seg(t, P.result, P.result + 0.6));
  const hover = seg(t, P.result + 4, P.result + 6);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 460, top: 470 - lift, width: 1000, height: 96, borderRadius: 48, border: `2px solid ${t >= P.enter ? C.sys : C.faint}`, background: '#0b0f16', display: 'flex', alignItems: 'center', padding: '0 40px', opacity: 1 - out, fontFamily: MONO, fontSize: 36, color: C.ink, gap: 24 }}>
        <svg width={40} height={40}><circle cx={16} cy={16} r={12} stroke={C.dim} strokeWidth={4} fill="none" /><line x1={25} y1={25} x2={37} y2={37} stroke={C.dim} strokeWidth={5} /></svg>
        <span>{typed('world.search(you);', t, P.type, (18 / (P.enter - P.type - 0.6)), 1)}{t < P.enter && <Cursor t={t} color={C.sys} />}</span>
      </div>
      {loading && Array.from({ length: 3 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: 500, top: 440 + i * 56, width: 920 - i * 160, height: 26, borderRadius: 13, background: `linear-gradient(90deg, #121a26 0%, #24324a ${((t * 90) % 100)}%, #121a26 100%)` }} />
      ))}
      {card > 0 && (
        <div style={{ position: 'absolute', left: 460, top: 420 + (1 - card) * 30, width: 1000, opacity: card * (1 - out) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: C.dim, letterSpacing: 3, marginBottom: 14 }}>1 RESULT · 0.0{Math.floor(t * 7) % 10}s</div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', padding: 28, border: `2px solid ${hover > 0.5 ? C.fanny : C.faint}`, background: hover > 0.5 ? 'rgba(255,194,74,0.06)' : '#0b0f16', borderRadius: 16 }}>
            <Img src={staticFile('avatars/fanny_px20.png')} style={{ width: 140, imageRendering: 'pixelated' }} />
            <div style={{ fontFamily: MONO }}>
              <div style={{ fontSize: 40, color: C.ink, fontWeight: 700 }}>FANNY CRAIG · No.007</div>
              <div style={{ fontSize: 22, color: C.fanny, marginTop: 10 }}>MATCH 99.7% · UNVERIFIED</div>
              <div style={{ fontSize: 18, color: C.dim, marginTop: 8 }}>last seen: the night of the fall · location: [boundary]</div>
            </div>
          </div>
          <svg width={60} height={60} style={{ position: 'absolute', left: 300 + (1 - hover) * 420, top: 150 + (1 - hover) * 160 }}>
            <path d="M6 4 L6 44 L18 32 L28 52 L36 48 L26 28 L42 28 Z" fill={C.ink} stroke="#000" strokeWidth={2} />
          </svg>
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center', opacity: seg(t, P.credits, P.credits + 1) }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 72, color: C.ink, letterSpacing: 4 }}>CASE #007</div>
        <div style={{ fontFamily: CJK, fontSize: 40, color: C.dim, marginTop: 10, letterSpacing: 12 }}>未完待续</div>
        <div style={{ fontFamily: CJK, fontSize: 30, color: C.fanny, marginTop: 40, opacity: seg(t, P.credits + 1.4, P.credits + 2.2) }}>「果然还得是我呀。」</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 100, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: C.dim, letterSpacing: 2, opacity: seg(t, P.credits + 2, P.credits + 3) }}>
        MUSIC  MILI — world.search(you);   ·   CHARACTERS  吉星派对 · 邦妮 / 芬妮   ·   UNOFFICIAL FAN-MADE
      </div>
    </AbsoluteFill>
  );
}

export const MODERN_SCENES = { triad, mirror, firewall, recursion, flood, onematch, boundary, calm, returnyou, ending };
