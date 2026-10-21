// All timing for the reel, in frames at 30 fps.
export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// Voiceover sentence durations (seconds), measured from public/vo-N.wav.
const VO_DUR = [1.939, 5.039, 2.02, 4.714, 2.159, 7.094, 3.611, 3.738, 0.789, 4.098];
const GAP = 0.3;

export const CLIP_END = s(6); // film excerpt runs 0–6 s
const VO_START_SEC = 6.6;

// Sentences 1–8: the synopsis, back to back.
const starts: number[] = [];
let t = VO_START_SEC;
for (let i = 0; i < 8; i++) {
	starts.push(t);
	t += VO_DUR[i] + GAP;
}
// Sentence 9: "Мой вердикт —", then the slam.
const verdictStart = t + 0.2;
starts.push(verdictStart);
const slamSec = verdictStart + VO_DUR[8] + 0.35;
// Sentence 10: subscribe call to action.
const ctaSec = slamSec + 3.2;
starts.push(ctaSec + 0.4);
const endSec = ctaSec + 0.4 + VO_DUR[9] + 1.6;

export const VO = VO_DUR.map((d, i) => ({file: `vo-${i + 1}.wav`, from: s(starts[i]), dur: s(d)}));
export const SYNOPSIS_START = s(VO_START_SEC - 0.4);
export const TIER_START = s(verdictStart - 0.5);
export const SLAM = s(slamSec);
export const CTA_START = s(ctaSec);
export const TOTAL_FRAMES = s(endSec);

// On-screen captions, split into short chunks per voiceover sentence.
export const CAPTIONS: string[][] = [
	['Микки Холлер —', 'адвокат без офиса.'],
	['Он ведёт дела', 'прямо с заднего сиденья', 'своего «Линкольна»', 'и вытаскивает', 'почти любого клиента.'],
	['Однажды ему достаётся', 'дело мечты.'],
	['Богатый наследник', 'из Беверли-Хиллз', 'обвиняется в нападении', 'на девушку', 'и клянётся,', 'что невиновен.'],
	['Гонорар — огромный.', 'Дело — простое.'],
	[
		'Но чем глубже',
		'Микки копает,',
		'тем яснее понимает:',
		'его клиент связан',
		'со старым делом,',
		'из-за которого',
		'невиновный человек',
		'сидит в тюрьме.',
	],
	['А рассказать правду', 'Микки не может —', 'его связывает', 'адвокатская тайна.'],
	['Макконахи —', 'в одной из лучших ролей.', 'Напряжение —', 'до последней сцены.'],
	['Мой вердикт —'],
	['Подписывайся!', 'На канале ещё много фильмов,', 'которые можно посмотреть', 'на YouTube.'],
];

// Big headline shown with each synopsis sentence.
export const HEADLINES: string[] = [
	'АДВОКАТ\nБЕЗ ОФИСА',
	'ОФИС —\nЗАДНЕЕ СИДЕНЬЕ',
	'ДЕЛО\nМЕЧТЫ',
	'«Я НЕ\nВИНОВЕН»',
	'ГОНОРАР:\nОГРОМНЫЙ',
	'НЕВИНОВНЫЙ —\nЗА РЕШЁТКОЙ',
	'АДВОКАТСКАЯ\nТАЙНА',
	'МЭТТЬЮ\nМАККОНАХИ',
];

// Caption chunk timing: proportional to chunk length within its sentence.
export const captionChunks = () =>
	CAPTIONS.flatMap((chunks, i) => {
		const {from, dur} = VO[i];
		const total = chunks.reduce((a, c) => a + c.length, 0);
		let acc = 0;
		return chunks.map((text) => {
			const start = from + Math.round((acc / total) * dur);
			acc += text.length;
			const end = from + Math.round((acc / total) * dur);
			return {text, start, end, sentence: i};
		});
	});
