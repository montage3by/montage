#!/usr/bin/env bash
# Двухпроходная нормализация громкости (EBU R128). Видео копируется без перекодирования.
# Использование: loudnorm.sh in.mp4 out.mp4 [I=-14] [TP=-1.5]
set -euo pipefail
in="${1:?usage: loudnorm.sh in out [I] [TP]}"; out="${2:?}"; I="${3:--14}"; TP="${4:--1.5}"; LRA=11
m=$(ffmpeg -hide_banner -i "$in" -vn -af "loudnorm=I=$I:TP=$TP:LRA=$LRA:print_format=json" -f null - 2>&1 \
  | sed -n '/^{/,/^}/p' \
  | python3 -c 'import json,sys; d=json.load(sys.stdin)
if d["input_i"] == "-inf": sys.exit("в файле тишина: нормализовать нечего")
print(":".join(f"{k}={d[v]}" for k,v in [("measured_I","input_i"),("measured_TP","input_tp"),("measured_LRA","input_lra"),("measured_thresh","input_thresh"),("offset","target_offset")]))')
case "${out##*.}" in wav) ac=(-c:a pcm_s24le) ;; *) ac=(-c:a aac -b:a 320k) ;; esac
ffmpeg -v error -y -i "$in" -c:v copy -af "loudnorm=I=$I:TP=$TP:LRA=$LRA:$m:linear=true" -ar 48000 "${ac[@]}" "$out"
ffmpeg -hide_banner -i "$out" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+(I|Peak):' | sed 's/^ */result /'
