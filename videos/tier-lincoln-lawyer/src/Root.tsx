import React from 'react';
import {Composition} from 'remotion';
import {TierReel, TOTAL_FRAMES} from './TierReel';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="TierReel"
		component={TierReel}
		durationInFrames={TOTAL_FRAMES}
		fps={30}
		width={1080}
		height={1920}
		// Set hasClip to true after putting the film excerpt at public/clip.mp4.
		defaultProps={{hasClip: false}}
	/>
);
