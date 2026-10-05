import React from 'react';
import {Composition} from 'remotion';
import {KuroLoop, LOOP_FRAMES} from './KuroLoop';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="KuroLoop"
		component={KuroLoop}
		durationInFrames={LOOP_FRAMES}
		fps={30}
		width={1920}
		height={1080}
	/>
);
