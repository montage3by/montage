import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Every motion repeats with a period that divides LOOP_FRAMES, so the clip loops seamlessly.
export const LOOP_FRAMES = 360; // 12 s at 30 fps

const IMG = staticFile('render.jpg');
const IMG_W = 2000;
const IMG_H = 1167;

const TAU = Math.PI * 2;

// Pool water outline in source-image pixels.
const POOL: [number, number][] = [
	[700, 812],
	[1180, 772],
	[1300, 738],
	[1440, 728],
	[1905, 730],
	[1950, 760],
	[1945, 1095],
	[1740, 1097],
	[1500, 1082],
	[1300, 1047],
	[1150, 1002],
	[1000, 962],
	[890, 927],
	[890, 842],
	[700, 842],
];
const POOL_PATH = `M${POOL.map(([x, y]) => `${x},${y}`).join(' L')} Z`;
const POOL_BOX = {x: 690, y: 720, w: 1270, h: 385};

// ---------- Caustics: light ridges drawn on a low-res canvas each frame ----------

const CAUSTIC_SCALE = 3; // canvas pixel = 3 source pixels

const Caustics: React.FC = () => {
	const frame = useCurrentFrame();
	const ref = useRef<HTMLCanvasElement>(null);
	const cw = Math.ceil(POOL_BOX.w / CAUSTIC_SCALE);
	const ch = Math.ceil(POOL_BOX.h / CAUSTIC_SCALE);

	useLayoutEffect(() => {
		const ctx = ref.current?.getContext('2d');
		if (!ctx) return;
		const img = ctx.createImageData(cw, ch);
		const p = (frame / LOOP_FRAMES) * TAU;
		for (let j = 0; j < ch; j++) {
			// Perspective: the far side of the pool is compressed, so pattern frequency rises there.
			const depth = j / ch; // 0 = far, 1 = near
			const k = 1.9 - depth * 1.0;
			const y = j * CAUSTIC_SCALE * k * 1.8;
			for (let i = 0; i < cw; i++) {
				const x = i * CAUSTIC_SCALE * k;
				const v =
					Math.sin(x * 0.045 + Math.sin(y * 0.05 + p) * 1.7 + p) +
					Math.sin(y * 0.06 + Math.sin(x * 0.03 - p * 2) * 1.5 - p) +
					Math.sin((x + y) * 0.028 + Math.sin(x * 0.02 + p) + p * 3);
				const ridge = Math.max(0, 1 - Math.abs(v) * 1.1);
				const a = Math.pow(ridge, 3) * 255;
				const o = (j * cw + i) * 4;
				img.data[o] = 235;
				img.data[o + 1] = 255;
				img.data[o + 2] = 255;
				img.data[o + 3] = a;
			}
		}
		ctx.putImageData(img, 0, 0);
	}, [frame, cw, ch]);

	return (
		<canvas
			ref={ref}
			width={cw}
			height={ch}
			style={{
				position: 'absolute',
				left: POOL_BOX.x,
				top: POOL_BOX.y,
				width: POOL_BOX.w,
				height: POOL_BOX.h,
				opacity: 0.32,
				mixBlendMode: 'soft-light',
				filter: 'blur(1.5px)',
				clipPath: `path('${POOL.map(([x, y], idx) => `${idx ? 'L' : 'M'}${x - POOL_BOX.x},${y - POOL_BOX.y}`).join(' ')} Z')`,
			}}
		/>
	);
};

// ---------- Water surface wobble (reflections ripple) ----------

const Wobble: React.FC = () => {
	const frame = useCurrentFrame();
	const p = (frame / LOOP_FRAMES) * TAU;
	// Two noise fields cross-fade; both scales are periodic.
	const s1 = 4 + 3 * Math.sin(p * 6);
	const s2 = 4 + 3 * Math.cos(p * 6);
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0}}>
			<defs>
				<clipPath id="pool">
					<path d={POOL_PATH} />
				</clipPath>
				<filter id="w1" x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves={2} seed={3} />
					<feDisplacementMap in="SourceGraphic" scale={s1} xChannelSelector="R" yChannelSelector="G" />
				</filter>
				<filter id="w2" x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.015 0.06" numOctaves={2} seed={11} />
					<feDisplacementMap in="SourceGraphic" scale={s2} xChannelSelector="G" yChannelSelector="R" />
				</filter>
			</defs>
			<g clipPath="url(#pool)">
				<image href={IMG} width={IMG_W} height={IMG_H} filter="url(#w1)" />
				<image href={IMG} width={IMG_W} height={IMG_H} filter="url(#w2)" opacity={0.5} />
			</g>
		</svg>
	);
};

// ---------- Sun glints on the water ----------

const GLINTS = 26;

const Glints: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width={IMG_W} height={IMG_H} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
			<defs>
				<radialGradient id="gl">
					<stop offset="0" stopColor="#fff" stopOpacity={1} />
					<stop offset="1" stopColor="#fff" stopOpacity={0} />
				</radialGradient>
				<clipPath id="pool2">
					<path d={POOL_PATH} />
				</clipPath>
			</defs>
			<g clipPath="url(#pool2)">
				{new Array(GLINTS).fill(0).map((_, i) => {
					const x = POOL_BOX.x + 200 + random(`gx${i}`) * (POOL_BOX.w - 220);
					const y = POOL_BOX.y + 20 + random(`gy${i}`) * (POOL_BOX.h - 60);
					const period = [60, 90, 120][i % 3];
					const offset = Math.floor(random(`go${i}`) * period);
					const q = ((frame + offset) % period) / period;
					const life = q < 0.25 ? Math.sin((q / 0.25) * Math.PI) : 0;
					if (life <= 0) return null;
					const size = 6 + random(`gs${i}`) * 10;
					const near = (y - POOL_BOX.y) / POOL_BOX.h;
					const s = size * (0.6 + near * 0.8) * life;
					return (
						<g key={i} opacity={0.75 * life}>
							<circle cx={x} cy={y} r={s * 1.6} fill="url(#gl)" />
							<path
								d={`M${x - s * 2.4},${y} L${x + s * 2.4},${y} M${x},${y - s * 1.4} L${x},${y + s * 1.4}`}
								stroke="#fff"
								strokeWidth={1.2}
								strokeLinecap="round"
							/>
						</g>
					);
				})}
			</g>
		</svg>
	);
};

// ---------- Warm sunlight breathing from the top right ----------

const Sun: React.FC = () => {
	const frame = useCurrentFrame();
	const b = 0.5 + 0.5 * Math.sin((frame / 180) * TAU);
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background:
					'radial-gradient(ellipse 55% 45% at 92% 6%, rgba(255,236,200,0.55), rgba(255,236,200,0) 70%)',
				mixBlendMode: 'screen',
				opacity: 0.45 + 0.35 * b,
			}}
		/>
	);
};

type Layout = 'wide' | 'vertical';

export const PoolLoop: React.FC<{layout: Layout}> = ({layout}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const t = frame / LOOP_FRAMES;
	// 0 → 1 → 0 over the loop, eased at both ends.
	const swing = 0.5 - 0.5 * Math.cos(t * TAU);

	let scale: number;
	let cx: number;
	let cy: number;
	if (layout === 'wide') {
		const base = Math.max(width / IMG_W, height / IMG_H);
		scale = base * (1.06 + 0.06 * swing);
		cx = 960 + 120 * swing;
		cy = 600 + 20 * swing;
	} else {
		const base = height / IMG_H;
		scale = base * (1.02 + 0.02 * swing);
		// Glide from the building and palm to the pool and back.
		cx = 820 + 760 * swing;
		cy = IMG_H / 2;
	}
	// Keep the frame inside the image.
	const halfW = width / scale / 2;
	const halfH = height / scale / 2;
	cx = Math.min(IMG_W - halfW, Math.max(halfW, cx));
	cy = Math.min(IMG_H - halfH, Math.max(halfH, cy));

	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: width / 2 - cx * scale,
					top: height / 2 - cy * scale,
					width: IMG_W,
					height: IMG_H,
					transform: `scale(${scale})`,
					transformOrigin: '0 0',
				}}
			>
				<Img src={IMG} style={{position: 'absolute', inset: 0, width: IMG_W, height: IMG_H}} />
				<Wobble />
				<Caustics />
				<Glints />
				<Sun />
			</div>
		</AbsoluteFill>
	);
};
