#!/usr/bin/env bash
# Пережать H.264 в два прохода под лимит размера (например, 30 МБ для чата).
# Использование: fit-size.sh in.mp4 out.mp4 [MB=28]
set -euo pipefail
in="${1:?usage: fit-size.sh in out [MB]}"; out="${2:?}"; mb="${3:-28}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
size=$(stat -c %s "$in"); limit=$((mb * 1024 * 1024))
if [ "$size" -le "$limit" ]; then cp "$in" "$out"; echo "already fits: $((size / 1048576)) MB"; exit 0; fi
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
has_audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$in" | head -1)
ak=0; [ -n "$has_audio" ] && ak=160
vk=$(awk -v mb="$mb" -v d="$dur" -v a="$ak" 'BEGIN{printf "%d", mb*8*1024*0.96/d - a}')
[ "$vk" -lt 500 ] && { echo "too long for ${mb} MB: ${vk} kbit/s video — режь ролик или выкладывай на Drive" >&2; exit 1; }
common=(-c:v libx264 -preset slow -b:v "${vk}k" -pix_fmt yuv420p -passlogfile "$tmp/pass")
ffmpeg -v error -y -i "$in" "${common[@]}" -pass 1 -an -f mp4 /dev/null
audio=(-an); [ -n "$has_audio" ] && audio=(-c:a aac -b:a "${ak}k")
ffmpeg -v error -y -i "$in" "${common[@]}" -pass 2 "${audio[@]}" -movflags +faststart "$out"
echo "video ${vk} kbit/s -> $(( $(stat -c %s "$out") / 1048576 )) MB"
