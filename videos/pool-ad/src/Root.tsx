import React from 'react';
import {Composition} from 'remotion';
import {LOOP_FRAMES, PoolLoop} from './PoolLoop';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="PoolWide"
			component={PoolLoop}
			durationInFrames={LOOP_FRAMES}
			fps={30}
			width={1920}
			height={1080}
			defaultProps={{layout: 'wide' as const}}
		/>
		<Composition
			id="PoolVertical"
			component={PoolLoop}
			durationInFrames={LOOP_FRAMES}
			fps={30}
			width={1080}
			height={1920}
			defaultProps={{layout: 'vertical' as const}}
		/>
	</>
);
