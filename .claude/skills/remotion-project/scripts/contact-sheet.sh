#!/usr/bin/env bash
# Контактный лист: COLS×ROWS кадров из середин равных отрезков ролика, с тайм-кодом.
# Использование: contact-sheet.sh video.mp4 [out.png] [cols] [rows]
set -euo pipefail
v="${1:?usage: contact-sheet.sh video.mp4 [out.png] [cols] [rows]}"
out="${2:-${v%.*}-sheet.png}"; cols="${3:-4}"; rows="${4:-3}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v")
n=$((cols * rows))
font=$(fc-match -f '%{file}' 'DejaVu Sans:bold')
for ((i = 0; i < n; i++)); do
  t=$(awk -v d="$dur" -v n="$n" -v i="$i" 'BEGIN{printf "%.2f", (i + 0.5) * d / n}')
  ffmpeg -v error -y -ss "$t" -i "$v" -frames:v 1 -vf \
    "scale=480:480:force_original_aspect_ratio=decrease,drawtext=fontfile=${font}:text='${t}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4" \
    "$tmp/$(printf '%03d' "$i").png"
done
ffmpeg -v error -y -i "$tmp/%03d.png" -vf "tile=${cols}x${rows}:padding=4:color=black" -frames:v 1 "$out"
echo "$out"
