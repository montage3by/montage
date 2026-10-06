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

const SERIF = 'Cormorant Garamond';
const SANS = 'Manrope';
const GOLD = '#E6D2A6';

const useFonts = () => {
	const [handle] = useState(() => delayRender('fonts'));
	useEffect(() => {
		const faces = [
			new FontFace(SERIF, `url(${staticFile('CormorantGaramond.ttf')})`, {weight: '600'}),
			new FontFace(SANS, `url(${staticFile('Manrope.ttf')})`, {weight: '600'}),
		];
		Promise.all(faces.map((f) => f.load()))
			.then((loaded) => {
				loaded.forEach((f) => document.fonts.add(f));
				continueRender(handle);
			})
			.catch((err) => {
				console.error(err);
				continueRender(handle);
			});
	}, [handle]);
};

type Line = {text: string; kind: 'big' | 'small'};

// Four messages, 90 frames each = the 360-frame loop.
const SLIDES: {wide: Line[]; vertical: Line[]}[] = [
	{
		wide: [
			{text: '5% VAT', kind: 'big'},
			{text: 'UNTIL THE END OF 2026', kind: 'small'},
		],
		vertical: [
			{text: '5% VAT', kind: 'big'},
			{text: 'UNTIL THE END OF 2026', kind: 'small'},
		],
	},
	{
		wide: [
			{text: '2-BEDROOM', kind: 'big'},
			{text: 'APARTMENTS', kind: 'small'},
		],
		vertical: [
			{text: '2-BEDROOM', kind: 'big'},
			{text: 'APARTMENTS', kind: 'small'},
		],
	},
	{
		wide: [
			{text: 'DELIVERY', kind: 'small'},
			{text: 'MAY 2027', kind: 'big'},
		],
		vertical: [
			{text: 'DELIVERY', kind: 'small'},
			{text: 'MAY 2027', kind: 'big'},
		],
	},
	{
		wide: [
			{text: 'RESERVE YOUR', kind: 'big'},
			{text: 'RESIDENCE TODAY', kind: 'big'},
		],
		vertical: [
			{text: 'RESERVE YOUR', kind: 'big'},
			{text: 'RESIDENCE', kind: 'big'},
			{text: 'TODAY', kind: 'big'},
		],
	},
];

const SLIDE_LEN = 90;
const OUT_LEN = 14;

const Slide: React.FC<{lines: Line[]; local: number; vertical: boolean; cta: boolean}> = ({
	lines,
	local,
	vertical,
	cta,
}) => {
	const {fps} = useVideoConfig();
	const bigSize = cta ? (vertical ? 96 : 112) : vertical ? 140 : 176;
	const smallSize = vertical ? 32 : 34;

	const out = interpolate(local, [SLIDE_LEN - OUT_LEN, SLIDE_LEN], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.cubic),
	});
	const rule = spring({frame: local - 10, fps, config: {damping: 200}, durationInFrames: 24});

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: vertical ? 'center' : 'flex-start',
				textAlign: vertical ? 'center' : 'left',
				opacity: 1 - out,
				transform: `translateY(${-24 * out}px)`,
				filter: `blur(${out * 6}px)`,
			}}
		>
			{/* Thin gold rule above the text */}
			<div
				style={{
					width: 120 * rule,
					height: 2,
					background: GOLD,
					marginBottom: 28,
				}}
			/>
			{lines.map((l, i) => {
				const p = spring({
					frame: local - 4 - i * 5,
					fps,
					config: {damping: 200},
					durationInFrames: 26,
				});
				const big = l.kind === 'big';
				// Small lines also tighten their tracking as they land.
				const tracking = big ? 0.02 : interpolate(p, [0, 1], [0.6, 0.32]);
				return (
					<div key={i} style={{overflow: 'hidden', paddingBottom: big ? 6 : 4}}>
						<div
							style={{
								transform: `translateY(${(1 - p) * 110}%)`,
								fontFamily: big ? SERIF : SANS,
								fontWeight: 600,
								fontSize: big ? bigSize : smallSize,
								lineHeight: big ? 0.98 : 1.4,
								letterSpacing: `${tracking}em`,
								color: big ? '#FFFFFF' : GOLD,
								textShadow: '0 2px 24px rgba(0,0,0,0.35)',
								whiteSpace: 'nowrap',
								// Lining figures: Cormorant defaults to old-style numerals.
								fontFeatureSettings: '"lnum" 1',
								marginTop: !big && i > 0 ? 18 : 0,
								marginBottom: !big && i === 0 ? 10 : 0,
							}}
						>
							{l.text}
						</div>
					</div>
				);
			})}
			{cta ? <CtaArrow local={local} vertical={vertical} /> : null}
		</div>
	);
};

// Animated arrow under the call to action, nudging forward twice.
const CtaArrow: React.FC<{local: number; vertical: boolean}> = ({local, vertical}) => {
	const {fps} = useVideoConfig();
	const p = spring({frame: local - 22, fps, config: {damping: 200}, durationInFrames: 22});
	const nudge = local > 40 ? Math.sin(((local - 40) / 25) * Math.PI * 2) * 8 : 0;
	const len = (vertical ? 200 : 240) * p;
	return (
		<svg width={260} height={30} style={{marginTop: 34, overflow: 'visible', opacity: p}}>
			<g transform={`translate(${(vertical ? (260 - len - 14) / 2 : 0) + nudge}, 15)`}>
				<line x1={0} y1={0} x2={len} y2={0} stroke={GOLD} strokeWidth={2} />
				<path d={`M${len - 12},-9 L${len + 2},0 L${len - 12},9`} fill="none" stroke={GOLD} strokeWidth={2} />
			</g>
		</svg>
	);
};

export const AdText: React.FC<{layout: 'wide' | 'vertical'}> = ({layout}) => {
	useFonts();
	const frame = useCurrentFrame();
	const vertical = layout === 'vertical';
	const index = Math.floor(frame / SLIDE_LEN) % SLIDES.length;
	const local = frame % SLIDE_LEN;
	const slide = SLIDES[index];

	return (
		<AbsoluteFill>
			{/* Scrim for legibility: from the left on 16:9, from the top on 9:16 */}
			<AbsoluteFill
				style={{
					background: vertical
						? 'linear-gradient(180deg, rgba(8,12,18,0.62) 0%, rgba(8,12,18,0.38) 34%, rgba(8,12,18,0) 55%)'
						: 'linear-gradient(90deg, rgba(8,12,18,0.58) 0%, rgba(8,12,18,0.34) 32%, rgba(8,12,18,0) 62%)',
				}}
			/>
			<AbsoluteFill
				style={
					vertical
						? {justifyContent: 'flex-start', alignItems: 'center', paddingTop: 300}
						: {justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 130}
				}
			>
				<Slide
					key={index}
					lines={vertical ? slide.vertical : slide.wide}
					local={local}
					vertical={vertical}
					cta={index === SLIDES.length - 1}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
