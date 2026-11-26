#!/usr/bin/env python3
"""Расшифровка речи в субтитры с пословными тайм-кодами (faster-whisper).

Использование (из venv, где стоит faster-whisper):
  transcribe.py in.mp4 out.srt [--model small] [--lang ru] [--max-chars 32] [--max-dur 2.5] [--json words.json]

SRT нарезан на короткие титры для вертикального видео: не длиннее --max-chars знаков
и --max-dur секунд, разрыв на паузе > 0.5 с и после . ! ? …
--json сохраняет слова с тайм-кодами — для пословной подсветки в Remotion.
"""
import argparse, json

END = (".", "!", "?", "…")


def group_words(words, max_chars=32, max_dur=2.5, gap=0.5):
    """words: [{'word','start','end'}] -> [{'text','start','end'}]"""
    cues, cur = [], []
    for w in words:
        if cur:
            text = " ".join(x["word"] for x in cur + [w])
            if (len(text) > max_chars or w["end"] - cur[0]["start"] > max_dur
                    or w["start"] - cur[-1]["end"] > gap or cur[-1]["word"].endswith(END)):
                cues.append(cur); cur = []
        cur.append(w)
    if cur:
        cues.append(cur)
    return [{"text": " ".join(x["word"] for x in c), "start": c[0]["start"], "end": c[-1]["end"]} for c in cues]


def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def to_srt(cues):
    return "\n".join(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n" for i, c in enumerate(cues, 1))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("inp"); p.add_argument("out")
    p.add_argument("--model", default="small"); p.add_argument("--lang", default="ru")
    p.add_argument("--max-chars", type=int, default=32); p.add_argument("--max-dur", type=float, default=2.5)
    p.add_argument("--json")
    a = p.parse_args()

    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(a.inp, language=a.lang, word_timestamps=True, vad_filter=True)
    words = [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
             for s in segments for w in (s.words or []) if w.word.strip()]
    cues = group_words(words, a.max_chars, a.max_dur)
    open(a.out, "w", encoding="utf-8").write(to_srt(cues))
    if a.json:
        json.dump(words, open(a.json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{a.out}: {len(cues)} титров, {len(words)} слов")
