import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Every motion below repeats with a period that divides LOOP_FRAMES,
// so the last frame flows straight into the first one.
export const LOOP_FRAMES = 360; // 12 s at 30 fps

const IMG = staticFile('kuro-vol14.jpg');
const IMG_W = 2000;
const IMG_H = 1116;

// Inside the cream border of the artwork.
const INNER = {x: 20, y: 14, w: 1960, h: 1088};

type Rect = {x: number; y: number; w: number; h: number};

const TAU = Math.PI * 2;
const wave = (frame: number, period: number, phase = 0) =>
	Math.sin(((frame % period) / period) * TAU + phase);

// A crop of the artwork itself, drawn on top with a filter / blend mode.
const Region: React.FC<{
	r: Rect;
	style?: React.CSSProperties;
	inner?: React.CSSProperties;
}> = ({r, style, inner}) => (
	<div
		style={{
			position: 'absolute',
			left: r.x,
			top: r.y,
			width: r.w,
			height: r.h,
			overflow: 'hidden',
			...style,
		}}
	>
		<Img
			src={IMG}
			style={{position: 'absolute', left: -r.x, top: -r.y, width: IMG_W, height: IMG_H, ...inner}}
		/>
	</div>
);

// ---------- Neon ----------

type Sign = Rect & {phase: number; flicker?: [number, number][]};

const SIGNS: Sign[] = [
	{x: 440, y: 185, w: 155, h: 130, phase: 0, flicker: [[96, 99], [102, 104], [107, 108], [290, 292]]}, // 夜
	{x: 120, y: 285, w: 270, h: 160, phase: 1.3}, // コンビニ
	{x: 750, y: 258, w: 70, h: 185, phase: 2.1, flicker: [[218, 221], [224, 230]]}, // ラーメン vertical
	{x: 650, y: 412, w: 130, h: 105, phase: 0.6}, // ラーメン horizontal
	{x: 874, y: 36, w: 60, h: 222, phase: 3.0}, // コンビから
	{x: 1512, y: 12, w: 102, h: 296, phase: 4.2}, // バー
	{x: 1446, y: 340, w: 168, h: 98, phase: 5.0, flicker: [[160, 162], [165, 167]]}, // 集中
	{x: 1362, y: 292, w: 52, h: 150, phase: 2.7}, // vertical small
	{x: 1772, y: 12, w: 208, h: 252, phase: 0.9}, // top-right
];

const isOff = (frame: number, ranges?: [number, number][]) =>
	!!ranges?.some(([a, b]) => frame >= a && frame <= b);

const Neon: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			{SIGNS.map((s, i) => {
				const off = isOff(frame, s.flicker);
				// Slow breathing glow, period 120 or 180 frames (both divide the loop).
				const breath = 0.5 + 0.5 * wave(frame, i % 2 ? 120 : 180, s.phase);
				const pad = 40;
				return (
					<React.Fragment key={i}>
						{/* Glow halo */}
						<Region
							r={{x: s.x - pad, y: s.y - pad, w: s.w + pad * 2, h: s.h + pad * 2}}
							style={{
								mixBlendMode: 'screen',
								opacity: off ? 0 : 0.22 + 0.28 * breath,
								filter: 'blur(14px) saturate(1.6) brightness(1.15)',
							}}
						/>
						{/* Power dip: darken the sign itself for a few frames */}
						{off ? (
							<Region r={s} style={{filter: 'brightness(0.42) saturate(0.6)'}} />
						) : null}
					</React.Fragment>
				);
			})}
		</>
	);
};

// ---------- Warm lights (vending machine, phone booth, taxi) ----------

const WARM: (Rect & {period: number; amp: number})[] = [
	{x: 1535, y: 515, w: 110, h: 170, period: 90, amp: 0.25}, // vending machine
	{x: 1745, y: 410, w: 210, h: 330, period: 360, amp: 0.2}, // phone booth
	{x: 340, y: 700, w: 60, h: 50, period: 60, amp: 0.3}, // taxi light L
	{x: 512, y: 705, w: 72, h: 50, period: 60, amp: 0.3}, // taxi light R
];

const WarmLights: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			{WARM.map((w, i) => (
				<Region
					key={i}
					r={w}
					style={{
						mixBlendMode: 'screen',
						opacity: w.amp * (0.5 + 0.5 * wave(frame, w.period, i)),
						filter: 'blur(10px) brightness(1.2)',
					}}
				/>
			))}
		</>
	);
};

// ---------- Rain ----------

const DROPS = 260;

const Rain: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / LOOP_FRAMES;
	const slant = 0.12; // dx per dy
	return (
		<svg
			width={IMG_W}
			height={IMG_H}
			style={{position: 'absolute', left: 0, top: 0}}
			viewBox={`0 0 ${IMG_W} ${IMG_H}`}
		>
			<defs>
				<clipPath id="inner">
					<rect x={INNER.x} y={INNER.y} width={INNER.w} height={INNER.h} />
				</clipPath>
			</defs>
			<g clipPath="url(#inner)">
				{new Array(DROPS).fill(0).map((_, i) => {
					const depth = random(`d${i}`); // 0 = far, 1 = near
					const len = 18 + depth * 46;
					// Whole number of falls per loop keeps it seamless.
					const laps = 9 + Math.floor(depth * 9);
					const span = IMG_H + len + 200;
					const p = (random(`p${i}`) + t * laps) % 1;
					const y = p * span - len - 100;
					const x = random(`x${i}`) * (IMG_W + 200) - 100 + y * slant;
					return (
						<line
							key={i}
							x1={x}
							y1={y}
							x2={x + len * slant}
							y2={y + len}
							stroke="#d9e6ff"
							strokeOpacity={0.12 + depth * 0.28}
							strokeWidth={0.8 + depth * 1.6}
							strokeLinecap="round"
						/>
					);
				})}
			</g>
		</svg>
	);
};

// ---------- Puddle ripples ----------

// Puddle areas as ellipses (cx, cy, rx, ry).
const PUDDLES = [
	[260, 875, 170, 22],
	[700, 1012, 55, 10],
	[1245, 848, 45, 9],
	[1390, 1045, 90, 18],
	[1600, 830, 80, 14],
	[560, 860, 120, 18],
	[1100, 1040, 70, 12],
];

const RIPPLES = 28;
const RIPPLE_PERIOD = 60; // each ripple restarts every 2 s

const Ripples: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0}}>
			{new Array(RIPPLES).fill(0).map((_, i) => {
				const [cx, cy, rx, ry] = PUDDLES[i % PUDDLES.length];
				const a = random(`ra${i}`) * TAU;
				const d = Math.sqrt(random(`rd${i}`));
				const x = cx + Math.cos(a) * rx * d * 0.8;
				const y = cy + Math.sin(a) * ry * d * 0.8;
				const offset = Math.floor(random(`ro${i}`) * RIPPLE_PERIOD);
				const p = ((frame + offset) % RIPPLE_PERIOD) / RIPPLE_PERIOD;
				const life = Math.min(1, p / 0.6); // visible for first 60% of the period
				if (p > 0.6) return null;
				const r = 3 + life * 16;
				return (
					<ellipse
						key={i}
						cx={x}
						cy={y}
						rx={r}
						ry={r * 0.32}
						fill="none"
						stroke="#e9dcff"
						strokeOpacity={0.45 * (1 - life)}
						strokeWidth={1.4}
					/>
				);
			})}
		</svg>
	);
};

// ---------- Steam ----------

const Steam: React.FC<{x: number; y: number; rise: number; count: number; size: number; seed: string}> = ({
	x,
	y,
	rise,
	count,
	size,
	seed,
}) => {
	const frame = useCurrentFrame();
	const period = 120; // divides the loop
	return (
		<>
			{new Array(count).fill(0).map((_, i) => {
				const p = ((frame + (i * period) / count) % period) / period;
				const sway = Math.sin(p * TAU * 1.2 + random(`${seed}${i}`) * TAU) * size * 0.5;
				const opacity = Math.sin(p * Math.PI) * 0.28;
				const s = size * (0.6 + p * 1.2);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x + sway - s / 2,
							top: y - p * rise - s / 2,
							width: s,
							height: s * 1.4,
							borderRadius: '50%',
							background: 'radial-gradient(closest-side, rgba(255,240,255,0.9), rgba(255,240,255,0))',
							opacity,
							filter: 'blur(4px)',
						}}
					/>
				);
			})}
		</>
	);
};

// ---------- Glint on the glasses ----------

const Glint: React.FC = () => {
	const frame = useCurrentFrame();
	// One sweep per loop, around 6.5 s.
	const start = 195;
	const dur = 18;
	const p = (frame - start) / dur;
	if (p < 0 || p > 1) return null;
	const lenses = [
		{cx: 975, cy: 540, r: 30},
		{cx: 1058, cy: 538, r: 30},
	];
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
			<defs>
				<clipPath id="lenses">
					{lenses.map((l, i) => (
						<circle key={i} cx={l.cx} cy={l.cy} r={l.r} />
					))}
				</clipPath>
				<linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
					<stop offset="0" stopColor="#fff" stopOpacity={0} />
					<stop offset="0.5" stopColor="#fff" stopOpacity={0.75} />
					<stop offset="1" stopColor="#fff" stopOpacity={0} />
				</linearGradient>
			</defs>
			<g clipPath="url(#lenses)">
				<rect
					x={930 + p * 180}
					y={490}
					width={34}
					height={110}
					fill="url(#g)"
					transform={`rotate(25 ${947 + p * 180} 545)`}
				/>
			</g>
		</svg>
	);
};

// ---------- Film grain ----------

const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay'}}>
			<filter id="n">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
			</filter>
			<rect width="100%" height="100%" filter="url(#n)" />
		</svg>
	);
};

export const KuroLoop: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	// Cover-fit the artwork, then a slow breathing zoom that returns to start.
	const base = Math.max(width / IMG_W, height / IMG_H);
	const zoom = base * (1.015 + 0.01 * (0.5 - 0.5 * Math.cos((frame / LOOP_FRAMES) * TAU)));
	return (
		<AbsoluteFill style={{background: '#120c24', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: width / 2,
					top: height / 2,
					width: IMG_W,
					height: IMG_H,
					transform: `translate(-50%, -50%) scale(${zoom})`,
				}}
			>
				<Img src={IMG} style={{position: 'absolute', inset: 0, width: IMG_W, height: IMG_H}} />
				<WarmLights />
				<Neon />
				<Ripples />
				<Steam x={1238} y={650} rise={170} count={7} size={34} seed="cup" />
				<Steam x={1365} y={915} rise={210} count={8} size={50} seed="hole" />
				<Glint />
				<Rain />
			</div>
			<Grain />
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(10,0,30,0.35) 100%)'}}
			/>
		</AbsoluteFill>
	);
};
