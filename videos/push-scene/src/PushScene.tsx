import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const DURATION = 150; // 5 s at 30 fps

const IMG = staticFile('scene.jpg');
const IMG_W = 2000;
const IMG_H = 1116;

// ---------- Timing ----------

// Soldiers' footsteps on the planks above (frames).
const STEPS = [6, 24, 41, 59, 76, 94, 111, 129, 146];

// Shoves: the hand pushes the boy out from under the cart.
// Each: anticipation (pull back), quick push, settle.
const SHOVES = [
	{at: 28, amount: 1.0},
	{at: 78, amount: 0.9},
	{at: 118, amount: 0.7},
];

const ease = Easing.bezier(0.2, 0.9, 0.25, 1);

// Accumulated push (in "push units") at a frame, with an optional lag in frames.
const pushAt = (frame: number, lag = 0) => {
	let total = 0;
	for (const s of SHOVES) {
		const f = frame - lag;
		const back = interpolate(f, [s.at - 7, s.at], [0, -0.15], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.inOut(Easing.quad),
		});
		const fwd = interpolate(f, [s.at, s.at + 7], [0, 1.15], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: ease,
		});
		const settle = interpolate(f, [s.at + 7, s.at + 16], [0, -0.15], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.inOut(Easing.quad),
		});
		// Pull-back only matters before the push lands.
		total += s.amount * (f < s.at ? back : fwd + settle);
	}
	return total;
};

// How hard the most recent footstep is still shaking things (1 → 0).
const stepImpact = (frame: number) => {
	let v = 0;
	for (const s of STEPS) {
		const d = frame - s;
		if (d >= 0 && d < 14) v = Math.max(v, Math.exp(-d / 3.2));
	}
	return v;
};

// ---------- Warp: the arm and the boy move, the background stays ----------

const Warp: React.FC = () => {
	const frame = useCurrentFrame();
	// Pixels of travel per push unit. The boy follows the hand 2 frames late.
	const armPx = 21 * pushAt(frame);
	const boyPx = 23 * pushAt(frame, 2);
	// feDisplacementMap: shift = scale * (map - 0.5); maps hold -0.5·w, so scale = 2·px.
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0}}>
			<defs>
				<filter
					id="push"
					x={0}
					y={0}
					width={IMG_W}
					height={IMG_H}
					filterUnits="userSpaceOnUse"
					primitiveUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feImage href={staticFile('disp-boy.png')} x={0} y={0} width={IMG_W} height={IMG_H} result="mb" preserveAspectRatio="none" />
					<feImage href={staticFile('disp-arm.png')} x={0} y={0} width={IMG_W} height={IMG_H} result="ma" preserveAspectRatio="none" />
					<feDisplacementMap in="SourceGraphic" in2="mb" scale={boyPx * 2} xChannelSelector="R" yChannelSelector="G" result="b" />
					<feDisplacementMap in="b" in2="ma" scale={armPx * 2} xChannelSelector="R" yChannelSelector="G" />
				</filter>
			</defs>
			<image href={IMG} width={IMG_W} height={IMG_H} filter="url(#push)" />
		</svg>
	);
};

// ---------- Light through the plank gaps ----------

// Gap polygons (source pixels), left to right.
const GAPS: [number, number][][] = [
	[[220, 135], [300, 135], [592, 335], [556, 342]],
	[[640, 120], [702, 120], [852, 332], [800, 334]],
	[[950, 105], [1022, 105], [1047, 322], [1004, 322]],
	[[1380, 98], [1422, 98], [1312, 322], [1284, 322]],
];
const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');

// Fire flicker + a foot shadow sweeping over the gap a soldier steps on.
const GapLight: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0}}>
			<defs>
				<filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation={10} />
				</filter>
			</defs>
			{GAPS.map((g, i) => {
				const flicker =
					0.5 +
					0.25 * Math.sin(frame * 0.9 + i * 2.1) +
					0.25 * (random(`fl${i}-${Math.floor(frame / 2)}`) - 0.5) * 2;
				// Which gap each step covers, cycling through the gaps.
				let shadow = 0;
				STEPS.forEach((s, k) => {
					if (k % GAPS.length !== (i * 3) % GAPS.length) return;
					const d = frame - s;
					shadow = Math.max(
						shadow,
						interpolate(d, [-6, -1, 4, 12], [0, 0.85, 0.85, 0], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
					);
				});
				return (
					<g key={i}>
						<polygon
							points={poly(g)}
							fill="#ffb05a"
							opacity={0.18 * flicker}
							style={{mixBlendMode: 'screen'}}
							filter="url(#soft)"
						/>
						<polygon points={poly(g)} fill="#0b0604" opacity={shadow} filter="url(#soft)" />
					</g>
				);
			})}
		</svg>
	);
};

// ---------- Dust shaken loose by each step ----------

const DUST_PER_STEP = 26;

const Dust: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0}}>
			{STEPS.flatMap((s, k) =>
				new Array(DUST_PER_STEP).fill(0).map((_, i) => {
					const d = frame - s;
					if (d < 0 || d > 45) return null;
					const g = GAPS[(k + i) % GAPS.length];
					// Start somewhere along the lower edge of a gap.
					const t = random(`dt${k}-${i}`);
					const x0 = g[3][0] + (g[2][0] - g[3][0]) * t + (random(`dx${k}-${i}`) - 0.5) * 60;
					const y0 = g[3][1] - 10 + random(`dy${k}-${i}`) * 20;
					const vx = (random(`vx${k}-${i}`) - 0.5) * 1.6;
					const vy = 1.5 + random(`vy${k}-${i}`) * 3;
					const x = x0 + vx * d;
					const y = y0 + vy * d + 0.18 * d * d;
					const r = 1 + random(`r${k}-${i}`) * 2.4;
					const lit = random(`l${k}-${i}`) > 0.55;
					const o = interpolate(d, [0, 4, 30, 45], [0, 0.85, 0.5, 0]);
					return (
						<circle
							key={`${k}-${i}`}
							cx={x}
							cy={y}
							r={r}
							fill={lit ? '#ffcf96' : '#cbb79c'}
							opacity={o * (lit ? 1 : 0.6)}
						/>
					);
				}),
			)}
			{/* Puff of haze under the gaps on each step */}
			{STEPS.map((s, k) => {
				const d = frame - s;
				if (d < 0 || d > 40) return null;
				const g = GAPS[k % GAPS.length];
				const cx = (g[2][0] + g[3][0]) / 2;
				const cy = g[2][1] + 30 + d * 1.5;
				return (
					<ellipse
						key={`h${k}`}
						cx={cx}
						cy={cy}
						rx={60 + d * 4}
						ry={30 + d * 2}
						fill="#d9b48a"
						opacity={interpolate(d, [0, 6, 40], [0, 0.16, 0])}
						style={{filter: 'blur(18px)'}}
					/>
				);
			})}
		</svg>
	);
};

// ---------- Embers drifting in the firelight ----------

const EMBERS = 22;

const Embers: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
			{new Array(EMBERS).fill(0).map((_, i) => {
				const life = 50 + random(`el${i}`) * 50;
				const p = ((frame + random(`eo${i}`) * life) % life) / life;
				const x = 200 + random(`ex${i}`) * 1300 + Math.sin(p * 6 + i) * 20;
				const y = 360 - p * 220 + random(`ey${i}`) * 120;
				const o = Math.sin(p * Math.PI) * (0.6 + 0.4 * Math.sin(frame * 0.7 + i));
				return <circle key={i} cx={x} cy={y} r={1.6 + random(`er${i}`) * 1.8} fill="#ff9a3c" opacity={o} />;
			})}
		</svg>
	);
};

export const PushScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();

	// Camera: cover-fit with margin for shake, slow push-in, jolt on each step.
	const base = Math.max(width / IMG_W, height / IMG_H) * 1.03;
	const zoom = base * interpolate(frame, [0, DURATION], [1, 1.03]);
	const hit = stepImpact(frame);
	const shakeY = hit * 7 * Math.sin(frame * 2.7);
	const shakeX = hit * 4 * Math.sin(frame * 3.9 + 1);
	const rot = hit * 0.25 * Math.sin(frame * 2.2);
	// Drift a little to the right, following the boy.
	const cx = IMG_W / 2 + interpolate(frame, [0, DURATION], [-20, 40]);
	const cy = IMG_H / 2;

	// A dark flash of dust/shadow across the whole frame on each step.
	const dim = hit * 0.12;

	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: width / 2 - cx + shakeX,
					top: height / 2 - cy + shakeY,
					width: IMG_W,
					height: IMG_H,
					transform: `scale(${zoom}) rotate(${rot}deg)`,
					transformOrigin: `${cx}px ${cy}px`,
				}}
			>
				<Warp />
				<GapLight />
				<Embers />
				<Dust />
			</div>
			<AbsoluteFill style={{background: '#000', opacity: dim}} />
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}}
			/>
		</AbsoluteFill>
	);
};
