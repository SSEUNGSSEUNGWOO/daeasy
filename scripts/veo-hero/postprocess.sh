#!/usr/bin/env bash
# Veo 원본 mp4 → 히어로 배경용 웹 에셋 일습.
#
#   ./postprocess.sh out/A-fast-s1000.mp4 hero-bg
#
# 만드는 것 (frontend/public/hero/ 로 바로 복사할 수 있는 형태):
#   <name>.mp4     H.264 무음 루프 (데스크톱)
#   <name>.webm    VP9 무음 루프 (더 작음, 지원 브라우저용)
#   <name>-9x16.mp4  세로 크롭 (모바일)
#   <name>-poster.jpg  LCP 대체 이미지
#
# 루프 이음새는 뒤 CROSSFADE 초를 앞과 겹쳐 없앤다. 결과 길이 = 원본 - CROSSFADE.
set -euo pipefail

SRC="${1:?사용법: ./postprocess.sh <원본.mp4> [출력이름]}"
NAME="${2:-hero-bg}"
DIST="$(dirname "$0")/dist"
CROSSFADE=1.0

mkdir -p "$DIST"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
BODY=$(awk -v d="$DUR" -v c="$CROSSFADE" 'BEGIN{printf "%.3f", d-c}')
echo "원본 ${DUR}s → 루프 ${BODY}s (크로스페이드 ${CROSSFADE}s)"

# 앞부분 [0,BODY) 과 꼬리 [BODY,DUR) 를 겹쳐 seamless 하게 만든다.
LOOP_FILTER="[0:v]trim=0:${BODY},setpts=PTS-STARTPTS[body];\
[0:v]trim=${BODY},setpts=PTS-STARTPTS[tail];\
[body][tail]xfade=transition=fade:duration=${CROSSFADE}:offset=$(awk -v b="$BODY" -v c="$CROSSFADE" 'BEGIN{printf "%.3f", b-c}')[v]"

echo "→ ${NAME}.mp4"
ffmpeg -y -loglevel error -i "$SRC" -filter_complex "$LOOP_FILTER" -map "[v]" \
  -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
  -movflags +faststart "$DIST/${NAME}.mp4"

echo "→ ${NAME}.webm"
ffmpeg -y -loglevel error -i "$SRC" -filter_complex "$LOOP_FILTER" -map "[v]" \
  -an -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 "$DIST/${NAME}.webm"

echo "→ ${NAME}-9x16.mp4"
ffmpeg -y -loglevel error -i "$SRC" \
  -filter_complex "${LOOP_FILTER};[v]crop=ih*9/16:ih[vc]" -map "[vc]" \
  -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -preset slow \
  -movflags +faststart "$DIST/${NAME}-9x16.mp4"

echo "→ ${NAME}-poster.jpg"
ffmpeg -y -loglevel error -ss 0 -i "$SRC" -frames:v 1 -q:v 4 "$DIST/${NAME}-poster.jpg"

echo
ls -lh "$DIST" | awk 'NR>1 {printf "  %-24s %s\n", $9, $5}'
