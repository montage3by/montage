import React, {useEffect, useState} from 'react';
import {
	AbsoluteFill,
	Audio,
	continueRender,
	delayRender,
	Easing,
	interpolate,
	OffthreadVideo,
	random,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {
	captionChunks,
	CLIP_END,
	CTA_START,
	HEADLINES,
	SLAM,
	TIER_START,
	TOTAL_FRAMES,
	VO,
} from './timeline';

export {TOTAL_FRAMES};

const SANS = 'Montserrat';
const SERIF = 'Playfair Display';
const GOLD = '#D9A94B';
const INK = '#0D0E12';

const useFonts = () => {
	const [handle] = useState(() => delayRender('fonts'));
	useEffect(() => {
		const faces = [
			new FontFace(SANS, `url(${staticFile('Montserrat.ttf')})`, {weight: '800'}),
			new FontFace(SERIF, `url(${staticFile('PlayfairDisplay.ttf')})`, {weight: '800'}),
		];
		Promise.all(faces.map((f) => f.load()))
			.then((l) => {
				l.forEach((f) => document.fonts.add(f));
				continueRender(handle);
			})
			.catch((e) => {
				console.error(e);
				continueRender(handle);
			});
	}, [handle]);
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- Shared pieces ----------

const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay'}}>
			<filter id="g">
				<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 9} />
			</filter>
			<rect width="100%" height="100%" filter="url(#g)" />
		</svg>
	);
};

const SeriesBadge: React.FC<{opacity?: number}> = ({opacity = 1}) => (
	<div style={{position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity}}>
		<div
			style={{
				fontFamily: SANS,
				fontWeight: 800,
				fontSize: 30,
				letterSpacing: '0.14em',
				color: INK,
				background: GOLD,
				padding: '14px 30px',
				borderRadius: 999,
			}}
		>
			ТИР-ЛИСТ · ФИЛЬМЫ НА YOUTUBE
		</div>
	</div>
);

// ---------- 1. Film excerpt ----------

const ClipSection: React.FC<{hasClip: boolean}> = ({hasClip}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const title = spring({frame: frame - 12, fps, config: {damping: 200}, durationInFrames: 20});
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{hasClip ? (
				<OffthreadVideo src={staticFile('clip.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			) : (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: '#16171c'}}>
					<div
						style={{
							width: 860,
							height: 1100,
							border: '6px dashed rgba(255,255,255,0.35)',
							borderRadius: 24,
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
							color: 'rgba(255,255,255,0.7)',
							fontFamily: SANS,
							fontWeight: 800,
							fontSize: 54,
							textAlign: 'center',
							gap: 24,
						}}
					>
						<div style={{fontSize: 120}}>▶</div>
						ОТРЫВОК
						<br />
						ИЗ ФИЛЬМА
						<div style={{fontSize: 30, opacity: 0.7}}>public/clip.mp4 · 6 сек</div>
					</div>
				</AbsoluteFill>
			)}
			<AbsoluteFill
				style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.75) 80%)'}}
			/>
			<SeriesBadge />
			<div
				style={{
					position: 'absolute',
					left: 70,
					right: 70,
					top: 1290,
					textAlign: 'center',
					color: '#fff',
					opacity: title,
					transform: `translateY(${(1 - title) * 40}px)`,
				}}
			>
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 84, lineHeight: 1.05}}>
					«Линкольн
					<br />
					для адвоката»
				</div>
				<div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: '0.2em', color: GOLD, marginTop: 18}}>
					2011 · КАКОЙ ТИР?
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------- 2. Synopsis ----------

// Slow headlight beams sweeping across a dark backdrop.
const NoirBackdrop: React.FC<{hasClip: boolean}> = ({hasClip}) => {
	const frame = useCurrentFrame();
	const sweep = (frame % 240) / 240;
	return (
		<AbsoluteFill style={{background: INK}}>
			{hasClip ? (
				<OffthreadVideo
					src={staticFile('clip.mp4')}
					muted
					style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(22px) brightness(0.45)', transform: 'scale(1.15)'}}
				/>
			) : (
				<>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #2a2418 0%, #121216 55%, #08080b 100%)'}} />
					<AbsoluteFill
						style={{
							background: `linear-gradient(${100 + sweep * 30}deg, rgba(0,0,0,0) ${20 + sweep * 40}%, rgba(217,169,75,0.10) ${30 + sweep * 40}%, rgba(0,0,0,0) ${42 + sweep * 40}%)`,
						}}
					/>
				</>
			)}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)'}} />
		</AbsoluteFill>
	);
};

// Prison bars drop over the headline for sentence 6.
const Bars: React.FC<{local: number}> = ({local}) => {
	const drop = interpolate(local, [6, 18], [-700, 0], {...clamp, easing: Easing.out(Easing.bounce)});
	return (
		<div style={{position: 'absolute', left: 120, right: 120, top: 470 + drop, height: 420, display: 'flex', justifyContent: 'space-between'}}>
			{new Array(7).fill(0).map((_, i) => (
				<div key={i} style={{width: 16, height: '100%', background: 'linear-gradient(90deg,#555,#bbb,#444)', borderRadius: 8, opacity: 0.85}} />
			))}
		</div>
	);
};

// Black redaction bars slide over the headline for sentence 7.
const Redact: React.FC<{local: number}> = ({local}) => {
	const w = interpolate(local, [30, 46], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	return (
		<>
			{[0, 1].map((r) => (
				<div
					key={r}
					style={{position: 'absolute', left: 110, top: 560 + r * 150, height: 120, width: 860 * w, background: '#000', borderRadius: 6}}
				/>
			))}
		</>
	);
};

const Headline: React.FC<{text: string; local: number; index: number}> = ({text, local, index}) => {
	const {fps} = useVideoConfig();
	const p = spring({frame: local, fps, config: {damping: 14, stiffness: 160, mass: 0.6}});
	const lines = text.split('\n');
	return (
		<div style={{position: 'absolute', left: 60, right: 60, top: 520, textAlign: 'center'}}>
			<div style={{width: 140 * p, height: 6, background: GOLD, margin: '0 auto 34px'}} />
			{lines.map((l, i) => {
				const q = spring({frame: local - i * 4, fps, config: {damping: 16, stiffness: 170, mass: 0.6}});
				return (
					<div key={i} style={{overflow: 'hidden'}}>
						<div
							style={{
								fontFamily: index === 7 ? SERIF : SANS,
								fontWeight: 800,
								// Fit long lines on one row.
								fontSize: Math.min(132, Math.floor(880 / (l.length * 0.74))),
								whiteSpace: 'nowrap',
								lineHeight: 1.08,
								color: i === lines.length - 1 ? GOLD : '#fff',
								transform: `translateY(${(1 - q) * 110}%)`,
								textShadow: '0 6px 30px rgba(0,0,0,0.5)',
							}}
						>
							{l}
						</div>
					</div>
				);
			})}
		</div>
	);
};

const Captions: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	// The verdict line (sentence 9) is already shown as the board title.
	const chunk = captionChunks().find((c) => c.sentence !== 8 && frame >= c.start && frame < c.end + 4);
	if (!chunk) return null;
	const p = spring({frame: frame - chunk.start, fps, config: {damping: 12, stiffness: 220, mass: 0.5}});
	return (
		<div style={{position: 'absolute', left: 70, right: 70, top: 1180, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 66,
					lineHeight: 1.15,
					color: '#fff',
					textAlign: 'center',
					transform: `scale(${0.85 + 0.15 * p})`,
					opacity: p,
					WebkitTextStroke: '2px rgba(0,0,0,0.6)',
					textShadow: '0 4px 18px rgba(0,0,0,0.85)',
				}}
			>
				{chunk.text}
			</div>
		</div>
	);
};

const SynopsisSection: React.FC<{hasClip: boolean}> = ({hasClip}) => {
	const frame = useCurrentFrame() + CLIP_END; // absolute frame
	let idx = -1;
	for (let i = 0; i < 8; i++) if (frame >= VO[i].from - 4) idx = i;
	const local = idx >= 0 ? frame - (VO[idx].from - 4) : 0;
	return (
		<AbsoluteFill>
			<NoirBackdrop hasClip={hasClip} />
			<SeriesBadge opacity={0.9} />
			{idx >= 0 ? <Headline key={idx} text={HEADLINES[idx]} local={local} index={idx} /> : null}
			{idx === 5 ? <Bars local={local} /> : null}
			{idx === 6 ? <Redact local={local} /> : null}
		</AbsoluteFill>
	);
};

// ---------- 3. Tier board ----------

const TIERS = [
	{l: 'S', c: '#FF6B6B'},
	{l: 'A', c: '#FFA94D'},
	{l: 'B', c: '#FFD43B'},
	{l: 'C', c: '#C0EB75'},
	{l: 'D', c: '#74C0FC'},
];
const ROW_H = 150;
const BOARD_TOP = 600;
const BOARD_LEFT = 90;
const BOARD_W = 900;

const FilmCard: React.FC<{w: number; h: number}> = ({w, h}) => (
	<div
		style={{
			width: w,
			height: h,
			background: 'linear-gradient(160deg,#2b2417,#0d0e12)',
			border: `3px solid ${GOLD}`,
			borderRadius: 10,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			textAlign: 'center',
			color: '#fff',
			fontFamily: SERIF,
			fontWeight: 800,
			fontSize: w * 0.15,
			lineHeight: 1.05,
			boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
		}}
	>
		Линкольн
		<br />
		для
		<br />
		адвоката
		<div style={{fontFamily: SANS, fontSize: w * 0.09, color: GOLD, marginTop: w * 0.05}}>2011</div>
	</div>
);

const TierSection: React.FC = () => {
	const local = useCurrentFrame(); // starts at TIER_START
	const {fps} = useVideoConfig();
	const slamLocal = SLAM - TIER_START;
	const board = spring({frame: local, fps, config: {damping: 200}, durationInFrames: 16});

	// Card: hovers big in the middle, then flies into the S row.
	const fly = interpolate(local, [slamLocal - 7, slamLocal], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const appear = spring({frame: local - 4, fps, config: {damping: 12, stiffness: 140}});
	const hover = Math.sin(local / 6) * 8 * (1 - fly);
	const bigW = 360;
	const smallW = 112;
	const cardW = bigW + (smallW - bigW) * fly;
	const cardH = cardW * 1.25;
	const startX = 540 - bigW / 2;
	const startY = 1000;
	const endX = BOARD_LEFT + ROW_H + 18;
	const endY = BOARD_TOP + (ROW_H - smallW * 1.25) / 2;
	const x = startX + (endX - startX) * fly;
	const y = startY + (endY - startY) * fly + hover;
	const rot = (1 - fly) * -6;

	const after = local - slamLocal;
	const stamp = spring({frame: after - 3, fps, config: {damping: 9, stiffness: 180, mass: 0.7}});
	const flash = after >= 0 ? interpolate(after, [0, 6], [0.7, 0], clamp) : 0;
	const shake = after >= 0 && after < 14 ? Math.sin(after * 3.1) * 18 * Math.exp(-after / 4) : 0;
	const sPulse = after >= 0 ? 1 + 0.18 * Math.exp(-after / 5) : 1;

	return (
		<AbsoluteFill style={{background: INK, transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #241f15 0%, #0d0e12 70%)'}} />
			<SeriesBadge />
			<div
				style={{
					position: 'absolute',
					top: 380,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 58,
					color: '#fff',
					opacity: board,
				}}
			>
				МОЙ ВЕРДИКТ
			</div>
			{/* Board */}
			<div style={{position: 'absolute', left: BOARD_LEFT, top: BOARD_TOP + (1 - board) * 200, width: BOARD_W, opacity: board}}>
				{TIERS.map((t, i) => (
					<div key={t.l} style={{display: 'flex', height: ROW_H, marginBottom: 8}}>
						<div
							style={{
								width: ROW_H,
								background: t.c,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: SANS,
								fontWeight: 800,
								fontSize: 84,
								color: INK,
								transform: i === 0 ? `scale(${sPulse})` : undefined,
								borderRadius: 8,
							}}
						>
							{t.l}
						</div>
						<div style={{flex: 1, background: '#1a1b21', marginLeft: 8, borderRadius: 8}} />
					</div>
				))}
			</div>
			{/* Card */}
			<div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${local < slamLocal ? appear : 1})`}}>
				<FilmCard w={cardW} h={cardH} />
			</div>
			{/* Sparks on impact */}
			{after >= 0 && after < 24
				? new Array(18).fill(0).map((_, i) => {
						const a = random(`a${i}`) * Math.PI * 2;
						const v = 8 + random(`v${i}`) * 14;
						const d = after * v;
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: endX + smallW / 2 + Math.cos(a) * d,
									top: endY + 70 + Math.sin(a) * d,
									width: 10,
									height: 10,
									borderRadius: 5,
									background: i % 2 ? GOLD : '#FF6B6B',
									opacity: 1 - after / 24,
								}}
							/>
						);
					})
				: null}
			{/* Stamp */}
			<div
				style={{
					position: 'absolute',
					top: 1430,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					opacity: after >= 0 ? 1 : 0,
					transform: `scale(${2.4 - 1.4 * stamp}) rotate(-6deg)`,
				}}
			>
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 800,
						fontSize: 110,
						color: '#FF6B6B',
						border: '10px solid #FF6B6B',
						borderRadius: 18,
						padding: '6px 40px',
						letterSpacing: '0.06em',
					}}
				>
					S-ТИР
				</div>
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

// ---------- 4. Call to action ----------

const CtaSection: React.FC = () => {
	const local = useCurrentFrame();
	const {fps} = useVideoConfig();
	const inP = spring({frame: local, fps, config: {damping: 13, stiffness: 150}});
	const tapAt = 40;
	const press = interpolate(local, [tapAt - 4, tapAt, tapAt + 6], [1, 0.9, 1], clamp);
	const subscribed = local >= tapAt;
	const cursorX = interpolate(local, [14, tapAt - 2], [900, 600], {...clamp, easing: Easing.out(Easing.cubic)});
	const cursorY = interpolate(local, [14, tapAt - 2], [1400, 1010], {...clamp, easing: Easing.out(Easing.cubic)});
	const bell = subscribed ? Math.sin((local - tapAt) * 1.2) * 18 * Math.exp(-(local - tapAt) / 12) : 0;
	return (
		<AbsoluteFill style={{background: INK}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a1416 0%, #0d0e12 70%)'}} />
			<div style={{position: 'absolute', top: 460, left: 70, right: 70, textAlign: 'center', opacity: inP}}>
				<div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, color: '#fff', lineHeight: 1.15}}>
					Ещё больше фильмов,
					<br />
					которые есть на <span style={{color: '#FF3B3B'}}>YouTube</span>
				</div>
				<div style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, color: GOLD, marginTop: 26, letterSpacing: '0.06em'}}>
					— уже на канале
				</div>
			</div>
			<div style={{position: 'absolute', top: 920, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 26,
						padding: '34px 64px',
						borderRadius: 999,
						background: subscribed ? '#3a3b42' : '#FF0033',
						color: '#fff',
						fontFamily: SANS,
						fontWeight: 800,
						fontSize: 58,
						transform: `scale(${inP * press})`,
						boxShadow: subscribed ? 'none' : '0 18px 60px rgba(255,0,51,0.45)',
					}}
				>
					<span style={{display: 'inline-block', transform: `rotate(${bell}deg)`}}>🔔</span>
					{subscribed ? 'ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ'}
				</div>
			</div>
			{local < tapAt + 14 ? (
				<div style={{position: 'absolute', left: cursorX, top: cursorY, fontSize: 90, transform: `scale(${local >= tapAt - 4 && local < tapAt + 4 ? 0.85 : 1})`}}>
					👆
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------- Audio ----------

const Sound: React.FC = () => (
	<>
		{VO.map((v) => (
			<Sequence key={v.file} from={v.from}>
				<Audio src={staticFile(v.file)} volume={1} />
			</Sequence>
		))}
		{/* Music bed starts as the excerpt ends */}
		<Sequence from={CLIP_END - 15}>
			<Audio
				src={staticFile('drone.wav')}
				volume={(f) => interpolate(f, [0, 20, SLAM - CLIP_END, SLAM - CLIP_END + 30], [0, 0.32, 0.32, 0.18], clamp)}
			/>
		</Sequence>
		<Sequence from={VO[0].from} durationInFrames={SLAM - VO[0].from}>
			<Audio src={staticFile('tick.wav')} volume={0.1} />
		</Sequence>
		<Sequence from={VO[5].from} durationInFrames={SLAM - VO[5].from}>
			<Audio src={staticFile('pulse.wav')} volume={(f) => interpolate(f, [0, 30], [0, 0.22], clamp)} />
		</Sequence>
		<Sequence from={CLIP_END - 9}>
			<Audio src={staticFile('whoosh.wav')} volume={0.7} />
		</Sequence>
		<Sequence from={SLAM - 72}>
			<Audio src={staticFile('riser.wav')} volume={0.35} />
		</Sequence>
		<Sequence from={SLAM}>
			<Audio src={staticFile('boom.wav')} volume={0.9} />
		</Sequence>
		<Sequence from={CTA_START - 8}>
			<Audio src={staticFile('whoosh.wav')} volume={0.6} />
		</Sequence>
		<Sequence from={CTA_START + 40}>
			<Audio src={staticFile('pop.wav')} volume={0.8} />
		</Sequence>
	</>
);

export const TierReel: React.FC<{hasClip: boolean}> = ({hasClip}) => {
	useFonts();
	const frame = useCurrentFrame();
	// Quick white flash between sections.
	const flashAt = (f: number) => interpolate(frame, [f - 3, f, f + 6], [0, 0.55, 0], clamp);
	const flash = Math.max(flashAt(CLIP_END), flashAt(CTA_START));
	return (
		<AbsoluteFill style={{background: INK}}>
			<Sequence durationInFrames={CLIP_END}>
				<ClipSection hasClip={hasClip} />
			</Sequence>
			<Sequence from={CLIP_END} durationInFrames={TIER_START - CLIP_END}>
				<SynopsisSection hasClip={hasClip} />
			</Sequence>
			<Sequence from={TIER_START} durationInFrames={CTA_START - TIER_START}>
				<TierSection />
			</Sequence>
			<Sequence from={CTA_START}>
				<CtaSection />
			</Sequence>
			{/* Captions run across synopsis, verdict and CTA */}
			<Captions />
			<Grain />
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
			<Sound />
		</AbsoluteFill>
	);
};
