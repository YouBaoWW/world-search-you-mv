import React from 'react';
import { Composition, staticFile, getStaticFiles } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { WorldSearchYou } from './MV.jsx';

const hasSong = () => getStaticFiles().some((f) => f.name === 'song.mp3');
// With public/song.mp3 present the film is exactly as long as the song.
const metadata = async ({ props, defaultProps, abortSignal, compositionId }) => {
  const fps = compositionId === 'WorldSearchYouDraft' ? 30 : 60;
  const seconds = hasSong() ? await getAudioDurationInSeconds(staticFile('song.mp3')) : window.MV.DURATION;
  return { durationInFrames: Math.ceil(seconds * fps) };
};

export const Root = () => (
  <>
    {/* Final delivery: 1920x1080 @ 60 fps */}
    <Composition id="WorldSearchYou" component={WorldSearchYou} durationInFrames={295 * 60} fps={60} width={1920} height={1080} calculateMetadata={metadata} />
    {/* Same picture at 30 fps for quick reviews (render with --scale=0.5 for 540p) */}
    <Composition id="WorldSearchYouDraft" component={WorldSearchYou} durationInFrames={295 * 30} fps={30} width={1920} height={1080} calculateMetadata={metadata} />
  </>
);
