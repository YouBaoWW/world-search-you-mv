import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { HtmlInCanvasMotionBlur } from '@remotion/motion-blur';
import { fontsReady } from './fonts.js';
// The ASCII engine is plain scripts that hang off window.MV; order matters.
import './ascii/engine.js';
import './ascii/characters.js';
import './ascii/portraits.js';
import './ascii/pixelart.js';
import './ascii/display.js';
import './ascii/timeline.js';
import './ascii/scenes.js';
import './ascii/film.js';
import { MODERN_SCENES } from './modern/scenes.jsx';
import { C, MONO, CJK, Ground, Hud, Caption, Tear, hash, hasFile, clamp, seg, easeOut, preloadImages, portraitSrcs } from './modern/kit.jsx';
import { LyricBand, LyricKinetic, LyricHook, LyricWhisper, LyricStack, CandidateCard, planFor } from './modern/lyrics.jsx';

const MV = window.MV;
const hasSong = getStaticFiles().some((f) => f.name === 'song.mp3');
const hasLyrics = getStaticFiles().some((f) => f.name === 'data/lyrics.json');

let initP = null;
const init = () => (initP ||= (async () => {
  await fontsReady();
  const base = staticFile('avatars/x').replace(/avatars\/x$/, '');
  MV.__fannySrc = staticFile('avatars/fanny_px20.png');
  await Promise.all([MV.initAscii(base, hasFile), preloadImages(portraitSrcs())]);
  if (hasLyrics) MV.lyrics = await fetch(staticFile('data/lyrics.json')).then((r) => r.json()).catch(() => null);
})());

// ---- ASCII layer: the canvas engine, CRT -> CCFL LCD ----
// The legacy painter owns one global target. Render each temporal sample into
// that shared surface synchronously, then copy it to the sample's own canvas.
// Multiple motion-blur samples must never call setup() on competing targets.
let asciiSurface = null;
const AsciiLayer = ({ t, bands }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!asciiSurface) {
      asciiSurface = document.createElement('canvas');
      MV.setup(asciiSurface, 1.5);
    }
    MV.renderAscii(t, bands);
    if (cv.width !== asciiSurface.width || cv.height !== asciiSurface.height) {
      cv.width = asciiSurface.width; cv.height = asciiSurface.height;
    }
    const context = cv.getContext('2d');
    context.globalCompositeOperation = 'copy';
    context.drawImage(asciiSurface, 0, 0);
  });
  return <canvas ref={ref} style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }} />;
};

// ---- Modern layer: React motion graphics, IPS -> OLED ----
const Spectrum = ({ bands }) => (
  <svg width={600} height={24} style={{ position: 'absolute', left: 660, bottom: 66 }}>
    {bands.slice(0, 48).map((v, i) => <rect key={i} x={i * 12.5} y={24 - Math.max(1, v * 24)} width={8} height={Math.max(1, v * 24)} fill={C.dim} opacity={0.7} />)}
  </svg>
);

const EraShell = ({ t, era, trans }) => {
  const layers = [];
  if (era === 'lcd-ips') {
    layers.push(<AbsoluteFill key="grid" style={{ opacity: 0.07, backgroundImage: 'repeating-linear-gradient(90deg, #000 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 3px)' }} />);
    layers.push(<AbsoluteFill key="bleed" style={{ background: 'radial-gradient(circle at 0% 0%, rgba(150,160,190,0.07), transparent 30%), radial-gradient(circle at 100% 100%, rgba(150,160,190,0.06), transparent 30%)' }} />);
  }
  if (trans && trans.u >= 0.5) {
    const v = (trans.u - 0.5) / 0.5;
    if (trans.kind === 'backlight') {
      layers.push(<AbsoluteFill key="bl" style={{ background: '#000', opacity: Math.max(0, 1 - v * 1.4) * (hash(Math.floor(t * 24)) > 0.25 || v > 0.6 ? 1 : 0.6) }} />);
      layers.push(<AbsoluteFill key="bl2" style={{ background: 'rgb(120,128,150)', opacity: 0.22 * (1 - v) }} />);
    }
    if (trans.kind === 'oledWake') {
      const n = 48, rows = 27, cw = 1920 / n, ch = 1080 / rows;
      layers.push(<svg key="ow" width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        {Array.from({ length: n * rows }, (_, i) => hash(i * 71) > v ? <rect key={i} x={(i % n) * cw} y={Math.floor(i / n) * ch} width={cw + 1} height={ch + 1} fill="#000" /> : null)}
      </svg>);
    }
  }
  return <>{layers}</>;
};

const ACCENT = { bonnie: C.bonnie, fanny: C.fanny, sys: C.sys };

// One shot of the modern layer as a function of t (used twice inside a transition).
const ShotView = ({ t, k, b }) => {
  const s = MV.SHOTS[k], n = MV.SHOTS[k + 1], d = (n ? n.at : MV.DURATION) - s.at, e = t - s.at;
  const Scene = MODERN_SCENES[s.scene];
  return <AbsoluteFill><Scene t={t} e={e} d={d} u={e / d} pulse={b.pulse} beat={b.beat} shot={s} /></AbsoluteFill>;
};

// Transition into shot k around its cut: the previous shot and this one, both live.
const IN = 0.22, OUT = 0.45;
const Cut = ({ t, k, b }) => {
  const s = MV.SHOTS[k], kind = s.enter, prev = MV.SHOTS[k - 1];
  const live = kind && prev && prev.layer === 'modern' && t >= s.at - IN && t < s.at + OUT;
  if (!live || t < s.at && kind === 'glitch') return <ShotView t={t} k={t < s.at ? k - 1 : k} b={b} />;
  const p = seg(t, s.at - IN, s.at + OUT), before = t < s.at;
  const A = <ShotView t={t} k={k - 1} b={b} />, B = <ShotView t={t} k={k} b={b} />;
  if (kind === 'wipe') {
    const x = -25 + p * 150;
    return <AbsoluteFill>{A}
      <AbsoluteFill style={{ clipPath: `polygon(0 0, ${x}% 0, ${x - 25}% 100%, 0 100%)` }}><Ground t={t} era="oled" />{B}</AbsoluteFill>
      <AbsoluteFill style={{ background: C.bonnie, clipPath: `polygon(${x}% 0, ${x + 6}% 0, ${x - 19}% 100%, ${x - 25}% 100%)` }} />
    </AbsoluteFill>;
  }
  if (kind === 'zoom') return <AbsoluteFill>
    <AbsoluteFill style={{ transform: `scale(${1 + p * 0.6})`, opacity: 1 - easeOut(p * 1.4), filter: `blur(${p * 10}px)` }}>{A}</AbsoluteFill>
    <AbsoluteFill style={{ transform: `scale(${1.4 - 0.4 * easeOut(p)})`, opacity: easeOut(p) }}>{B}</AbsoluteFill>
  </AbsoluteFill>;
  if (kind === 'flash') return <AbsoluteFill>{before ? A : B}<AbsoluteFill style={{ background: '#fff', opacity: Math.max(0, 1 - Math.abs(t - s.at) / 0.3) }} /></AbsoluteFill>;
  if (kind === 'type') {
    // Rows of the next shot's case-log sweep across, covering the old picture, then clear.
    const cover = p < 0.5 ? p * 2 : (1 - p) * 2;
    return <AbsoluteFill>{before ? A : B}
      {Array.from({ length: 12 }, (_, r) => (
        <div key={r} style={{ position: 'absolute', left: 0, top: r * 90, height: 90, width: `${clamp(cover * 1.3 - r * 0.03) * 100}%`, background: r % 2 ? '#0d1420' : '#121b2a', overflow: 'hidden', whiteSpace: 'nowrap',
          fontFamily: MONO, fontSize: 52, lineHeight: '90px', color: r % 3 ? C.dim : C.sys }}>{(s.log + '   ').repeat(8)}</div>
      ))}
    </AbsoluteFill>;
  }
  // glitch: hard cut with a burst of tearing after it.
  return <Tear t={t} amount={0.9 * (1 - p)}>{B}</Tear>;
};

const ModernLayer = ({ t, bands }) => {
  const k = MV.shotIndex(t), { shot } = MV.shotAt(t);
  const { era, trans } = MV.eraAt(t);
  const b = MV.beatAt(t, bands);
  const ch = MV.CHAPTERS.filter((c) => c.at <= t).pop();
  const gk = MV.glitchAt(t);
  // Lyrics: current line, its plan, and how far the picture recedes for text-PV blocks.
  const L = MV.lyrics || [];
  const line = L.find((l) => t >= l.time && t < l.end);
  const plan = line ? planFor(line.n) : null;
  const block = MV.LYRIC_PLAN.filter((p) => p.dim).map((p) => {
    const ls = L.filter((l) => l.n >= p.from && l.n <= p.to);
    return ls.length ? { p, a: ls[0].time, z: ls[ls.length - 1].end, ls } : null;
  }).find((x) => x && t >= x.a - 0.4 && t < x.z + 0.4);
  const dim = block ? block.p.dim * clamp(Math.min(t - (block.a - 0.4), block.z + 0.4 - t) / 0.4) : 0;
  const accent = ACCENT[(plan && plan.accent) || 'sys'];
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Ground t={t} era={era.id} />
      <AbsoluteFill style={{ opacity: 1 - dim }}>
        <Tear t={t} amount={gk > 0.35 ? (gk - 0.35) * 1.4 : 0}><Cut t={t} k={k} b={b} /></Tear>
      </AbsoluteFill>
      {line && plan.style === 'kinetic' && <LyricKinetic t={t} line={line} accent={accent} />}
      {line && plan.style === 'hook' && <LyricHook t={t} line={line} accent={accent} />}
      {line && plan.style === 'whisper' && <LyricWhisper t={t} line={line} accent={accent} />}
      {block && block.p.style === 'stack' && <LyricStack t={t} lines={block.ls} accent={ACCENT[block.p.accent]} />}
      {line && (plan.style === 'band' || plan.style === 'term') && <LyricBand t={t} line={line} accent={accent} />}
      {(() => { const c = MV.candidateAt(t); return c && (!plan || plan.style !== 'hook') ? <CandidateCard t={t} c={c} /> : null; })()}
      <Hud t={t} chapter={ch.en} shot={shot.id} bpm={MV.BPM} era={era.label} />
      {!line && !block && <Caption t={t} t0={shot.at} en={shot.log} zh={shot.logZh} />}
      <Spectrum bands={b.bands} />
      <EraShell t={t} era={era.id} trans={trans} />
    </AbsoluteFill>
  );
};

const Stage = ({ t, bands }) => (MV.shotAt(t).shot.layer === 'ascii' ? <AsciiLayer t={t} bands={bands} /> : <ModernLayer t={t} bands={bands} />);

// This hook must live inside HtmlInCanvasMotionBlur: every sample receives its
// own fractional frame, including all Canvas scenes, lyrics and transitions.
const VisualFrame = ({ audioData }) => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const bands = audioData ? visualizeAudio({ fps, frame, audioData, numberOfSamples: 64 }).slice(0, 48).map((v) => Math.min(1, Math.sqrt(v) * 1.6)) : null;
  return <Stage t={frame / fps} bands={bands} />;
};

const BlurredStage = ({ audioData, motionBlur, motionBlurSamples, shutterAngle }) => {
  const { width, height, fps } = useVideoConfig();
  if (!motionBlur) return <VisualFrame audioData={audioData} />;
  return (
    <AbsoluteFill className="mv-motion-blur">
    {/* Remotion 4.0.539 hides its source canvas during capture. Its sibling
        samples need their own visibility override to retain paint records. */}
    <style>{'.mv-motion-blur canvas[content="drawable"] > div[drawable] { visibility: visible; }'}</style>
    <HtmlInCanvasMotionBlur width={width} height={height} samples={motionBlurSamples} shutterAngle={shutterAngle} premountFor={fps} name="Full-frame motion blur">
      <VisualFrame audioData={audioData} />
    </HtmlInCanvasMotionBlur>
    </AbsoluteFill>
  );
};

// Decode audio once outside the sampled visual tree. The audible track is also
// outside it, so temporal supersampling never duplicates or offsets the sound.
const WithAudio = (props) => {
  const audioData = useAudioData(staticFile('song.mp3'));
  return <BlurredStage {...props} audioData={audioData} />;
};

export const WorldSearchYou = ({ motionBlur = true, motionBlurSamples = 4, shutterAngle = 180 }) => {
  const [handle] = useState(() => delayRender('Loading fonts, avatars, portraits'));
  const [ok, setOk] = useState(false);
  useEffect(() => { init().then(() => { setOk(true); continueRender(handle); }); }, [handle]);
  const blur = { motionBlur, motionBlurSamples, shutterAngle };
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {ok && (hasSong ? <WithAudio {...blur} /> : <BlurredStage {...blur} audioData={null} />)}
      {hasSong && <Audio src={staticFile('song.mp3')} />}
    </AbsoluteFill>
  );
};
