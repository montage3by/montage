import React from 'react';
import {Composition} from 'remotion';
import {DURATION, PushScene} from './PushScene';

export const RemotionRoot: React.FC = () => (
	<Composition id="PushScene" component={PushScene} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
);
