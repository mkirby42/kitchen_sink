#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="${DEMO_MEDIA_ASSETS:-/Users/matt/.cursor/projects/Users-matt-CodePersonal-kitchen-sink/assets}"
OUT="$ROOT/supabase/seed/media"

declare -a ITEMS=(
  "11111111-1111-4111-8111-111111111111:maya-chen-headshot.png"
  "55555555-5555-4555-8555-555555555001:jordan-hale-headshot.png"
  "55555555-5555-4555-8555-555555555002:amara-okonkwo-headshot.png"
  "55555555-5555-4555-8555-555555555003:luis-ortega-headshot.png"
  "55555555-5555-4555-8555-555555555004:elena-vasquez-headshot.png"
  "55555555-5555-4555-8555-555555555005:sam-rivera-headshot.png"
  "55555555-5555-4555-8555-555555555006:noah-kim-headshot.png"
  "55555555-5555-4555-8555-555555555007:fatima-rahman-headshot.png"
  "55555555-5555-4555-8555-555555555008:owen-blake-headshot.png"
  "55555555-5555-4555-8555-555555555009:mei-lin-headshot.png"
  "55555555-5555-4555-8555-555555555010:chris-adeyemi-headshot.png"
)

for item in "${ITEMS[@]}"; do
  id="${item%%:*}"
  file="${item##*:}"
  src="$ASSETS/$file"
  dest="$OUT/$id"
  mkdir -p "$dest"
  if [[ ! -f "$src" ]]; then
    echo "missing $src" >&2
    exit 1
  fi
  ffmpeg -y -i "$src" \
    -vf "scale=720:720:force_original_aspect_ratio=increase,crop=720:720" \
    -q:v 4 "$dest/photo.jpg"
  ffmpeg -y -loop 1 -i "$dest/photo.jpg" \
    -vf "zoompan=z='min(zoom+0.0008,1.12)':d=96:s=720x720:fps=24,format=yuv420p" \
    -t 4 -c:v libx264 -preset veryfast -crf 28 -movflags +faststart \
    -an "$dest/intro.mp4"
  echo "wrote $dest"
done
