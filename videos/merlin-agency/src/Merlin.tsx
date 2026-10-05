import React, {useEffect, useState} from 'react';
import {
	AbsoluteFill,
	continueRender,
	delayRender,
	Easing,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

const COLORS = {
	bgInner: '#5B21D6',
	bgOuter: '#24075E',
	blobA: '#7C3AED',
	blobB: '#A274FF',
	blobC: '#8B5CF6',
	text: '#F7F3FF',
};

const FONT = 'Unbounded';

const useFont = () => {
	const [handle] = useState(() => delayRender('font'));
	useEffect(() => {
		const face = new FontFace(FONT, `url(${staticFile('Unbounded.ttf')})`, {weight: '900'});
		face
			.load()
			.then((f) => {
				document.fonts.add(f);
				continueRender(handle);
			})
			.catch((err) => {
				console.error(err);
				continueRender(handle);
			});
	}, [handle]);
};

type Layout = 'vertical' | 'horizontal';

// Ovals rising from the bottom edge of the word block, like the Scota showcase.
// x/w are fractions of the block width, h of the block height.
const BLOBS = [
	{x: 0.02, w: 0.24, h: 0.95, color: COLORS.blobA, delay: 0},
	{x: 0.2, w: 0.3, h: 1.35, color: COLORS.blobB, delay: 4},
	{x: 0.46, w: 0.22, h: 1.05, color: COLORS.blobA, delay: 8},
	{x: 0.63, w: 0.3, h: 1.25, color: COLORS.blobC, delay: 6},
	{x: 0.86, w: 0.16, h: 0.8, color: COLORS.blobB, delay: 11},
];

const Word: React.FC<{text: string; start: number; size: number}> = ({text, start, size}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div style={{display: 'flex', lineHeight: 1, letterSpacing: size * -0.02}}>
			{text.split('').map((ch, i) => {
				const p = spring({
					frame: frame - start - i * 2,
					fps,
					config: {damping: 14, stiffness: 140, mass: 0.7},
				});
				const y = interpolate(p, [0, 1], [115, 0]);
				const rot = interpolate(p, [0, 1], [8, 0]);
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							overflow: 'hidden',
							// Room for descenders (g, y) inside the mask.
							paddingBottom: size * 0.22,
							marginBottom: -size * 0.22,
						}}
					>
						<span
							style={{
								display: 'inline-block',
								transform: `translateY(${y}%) rotate(${rot}deg)`,
								whiteSpace: 'pre',
							}}
						>
							{ch}
						</span>
					</span>
				);
			})}
		</div>
	);
};

export const Merlin: React.FC<{layout: Layout}> = ({layout}) => {
	useFont();
	const frame = useCurrentFrame();
	const {fps, width, height, durationInFrames} = useVideoConfig();
	const vertical = layout === 'vertical';

	// Word block geometry.
	const size = vertical ? 188 : 160;
	const blockW = vertical ? width * 0.86 : width * 0.72;
	const blockH = vertical ? size * 2.1 : size * 1.05;
	// Shift down so text + blobs above it read as one centered group.
	const blockTop = (height - blockH) / 2 + (vertical ? size * 0.35 : size * 0.75);
	const blockLeft = (width - blockW) / 2;

	// Camera: fast settle in, then a slow push to the end.
	const settle = interpolate(frame, [0, 40], [1.12, 1], {
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const push = interpolate(frame, [40, durationInFrames], [1, 1.05], {
		extrapolateLeft: 'clamp',
	});
	const camRot = interpolate(frame, [0, 40], [-3, 0], {
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});

	// Underline bar grows after the letters land.
	const bar = spring({frame: frame - 48, fps, config: {damping: 20, stiffness: 90}});

	// Background breathes slightly.
	const glow = interpolate(Math.sin(frame / 22), [-1, 1], [55, 70]);

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle at 50% 50%, ${COLORS.bgInner} 0%, ${COLORS.bgOuter} ${glow}%)`,
				fontFamily: FONT,
				fontWeight: 900,
				overflow: 'hidden',
			}}
		>
			<AbsoluteFill style={{transform: `scale(${settle * push}) rotate(${camRot}deg)`}}>
				{/* Blobs */}
				{BLOBS.map((b, i) => {
					const s = spring({
						frame: frame - b.delay,
						fps,
						config: {damping: 13, stiffness: 110, mass: 0.8},
					});
					const bob = Math.sin((frame + i * 17) / 18) * 0.025;
					const bottom = blockTop + blockH * (vertical ? 0.98 : 1.0);
					const h = blockH * b.h * (vertical ? 0.95 : 2.1);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: blockLeft + blockW * b.x,
								top: bottom - h,
								width: blockW * b.w,
								height: h,
								borderRadius: '50%',
								background: b.color,
								transformOrigin: '50% 100%',
								transform: `scaleY(${s * (1 + bob)}) scaleX(${0.6 + 0.4 * s})`,
							}}
						/>
					);
				})}

				{/* Word block */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: blockTop,
						height: blockH,
						display: 'flex',
						flexDirection: vertical ? 'column' : 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: vertical ? size * 0.05 : size * 0.35,
						color: COLORS.text,
						fontSize: size,
					}}
				>
					<Word text="Merlin" start={10} size={size} />
					<Word text="Agency" start={vertical ? 20 : 22} size={size} />
				</div>

				{/* Underline bar */}
				<div
					style={{
						position: 'absolute',
						left: width / 2 - (blockW * 0.5 * bar) / 2,
						top: blockTop + blockH + (vertical ? 110 : 90),
						width: blockW * 0.5 * bar,
						height: vertical ? 16 : 14,
						borderRadius: 999,
						background: '#C4B5FD',
					}}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
