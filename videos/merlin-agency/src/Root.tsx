import React from 'react';
import {Composition} from 'remotion';
import {Merlin} from './Merlin';

const FPS = 30;
const DURATION = 6 * FPS;

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="MerlinVertical"
			component={Merlin}
			durationInFrames={DURATION}
			fps={FPS}
			width={1080}
			height={1920}
			defaultProps={{layout: 'vertical' as const}}
		/>
		<Composition
			id="MerlinHorizontal"
			component={Merlin}
			durationInFrames={DURATION}
			fps={FPS}
			width={1920}
			height={1080}
			defaultProps={{layout: 'horizontal' as const}}
		/>
	</>
);
