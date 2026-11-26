#!/usr/bin/env bash
# Проверка бесшовной петли: шов «последний кадр → первый» против соседних кадров.
# Использование: loop-check.sh video.mp4
set -euo pipefail
v="${1:?usage: loop-check.sh video.mp4}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

ffmpeg -v error -i "$v" -frames:v 1 "$tmp/first.png"
ffmpeg -v error -sseof -1 -i "$v" -update 1 "$tmp/last.png"

psnr_of() { grep -o 'average:[^ ]*' | tail -1 | cut -d: -f2; }

seam=$(ffmpeg -hide_banner -i "$tmp/last.png" -i "$tmp/first.png" -lavfi psnr -f null - 2>&1 | psnr_of)
# Кадр i против кадра i+1 по всему ролику; min — самый резкий переход внутри.
stats=$(ffmpeg -hide_banner -i "$v" -i "$v" -lavfi \
  "[1:v]trim=start_frame=1,setpts=PTS-STARTPTS[b];[0:v][b]psnr=stats_file=$tmp/p.log" -f null - 2>&1 | psnr_of)
min=$(grep -o 'psnr_avg:[^ ]*' "$tmp/p.log" | cut -d: -f2 | grep -v inf | sort -g | head -1)

echo "seam (last->first): ${seam} dB"
echo "neighbours: avg ${stats} dB, min ${min:-inf} dB"
awk -v s="$seam" -v m="${min:-999}" 'BEGIN{
  if (s=="inf" || s+0 >= m-1) print "OK: шов не заметнее обычной смены кадра";
  else print "SEAM: шов резче самого резкого соседнего перехода — петля рвётся";
}'
