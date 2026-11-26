#!/usr/bin/env python3
"""Вырезать паузы по звуку (silencedetect) и склеить остальное встык.

Использование:
  cut-silence.py in.mp4 out.mp4 [--db -35] [--min 0.35] [--pad 0.08] [--dry-run]

--db    порог тишины, дБ (тише — пауза). Шумная запись: -30; студия: -40.
--min   минимальная длина паузы, которую режем, с.
--pad   сколько тишины оставить у краёв фразы, с (чтобы не съесть дыхание и согласные).
--dry-run  только напечатать оставляемые отрезки (для монтажного листа).
"""
import argparse, re, subprocess, sys, tempfile, os

p = argparse.ArgumentParser()
p.add_argument("inp"); p.add_argument("out", nargs="?")
p.add_argument("--db", type=float, default=-35); p.add_argument("--min", type=float, default=0.35)
p.add_argument("--pad", type=float, default=0.08); p.add_argument("--dry-run", action="store_true")
a = p.parse_args()

dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                     "-of", "csv=p=0", a.inp]).strip())
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", a.inp, "-vn", "-af",
                      f"silencedetect=noise={a.db}dB:d={a.min}", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
ends += [dur] * (len(starts) - len(ends))  # тишина до конца файла

keep, cur = [], 0.0
for s, e in zip(starts, ends):
    s2, e2 = max(s + a.pad, 0.0), e - a.pad
    if e2 <= s2:
        continue
    if s2 > cur:
        keep.append((cur, s2))
    cur = e2
if cur < dur:
    keep.append((cur, dur))
keep = [(round(s, 3), round(e, 3)) for s, e in keep if e - s > 0.05]

total = sum(e - s for s, e in keep)
for s, e in keep:
    print(f"{s:8.3f} - {e:8.3f}")
print(f"кусков: {len(keep)}, было {dur:.1f} с, станет {total:.1f} с, вырезано {dur - total:.1f} с", file=sys.stderr)
if a.dry_run or not a.out:
    sys.exit(0)

expr = "+".join(f"between(t,{s},{e})" for s, e in keep)
with tempfile.TemporaryDirectory() as d:
    vf, af = os.path.join(d, "v.txt"), os.path.join(d, "a.txt")
    open(vf, "w").write(f"select='{expr}',setpts=N/FRAME_RATE/TB")
    open(af, "w").write(f"aselect='{expr}',asetpts=N/SR/TB")
    has_video = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v",
                                         "-show_entries", "stream=index", "-of", "csv=p=0", a.inp]).strip()
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", a.inp]
    if has_video:
        cmd += ["-filter_script:v", vf, "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p"]
    cmd += ["-filter_script:a", af, "-c:a", "aac", "-b:a", "320k", a.out]
    subprocess.run(cmd, check=True)
print(a.out)
