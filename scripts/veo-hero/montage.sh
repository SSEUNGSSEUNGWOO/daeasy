#!/usr/bin/env bash
# 여러 클립을 크로스디졸브로 이어 하나의 무결 루프로 만든다.
# 하드컷을 쓰지 않는 이유: 히어로 배경은 헤드라인 뒤에 깔리므로 컷이 튀면 시선을 뺏고,
# 짧은 주기로 반복되면 컷 시퀀스의 반복이 그대로 드러난다.
#
#   ./montage.sh out/A-fast-1.mp4 out/B-fast-1.mp4:4.5 out/C-fast-1.mp4:4.2:3.6
#
# 인자는 <파일>[:시작초[:길이초]]. 생성 아티팩트가 있는 구간을 건너뛰려고
# 시작초를 준다 (Veo 클립은 초반에 물체가 생겼다 사라지는 경우가 잦다).
# 각 클립에서 잘라낸 구간을 XF 초씩 겹친다. 마지막→처음도 겹쳐 이음새를 없앤다.
set -euo pipefail

USE=6.0          # 길이를 지정하지 않은 클립의 기본 사용 길이
XF=1.2           # 크로스디졸브 길이
NAME="${NAME:-hero-loop}"
DIST="$(dirname "$0")/dist"
mkdir -p "$DIST"

[ $# -ge 2 ] || { echo "클립을 2개 이상 주세요"; exit 1; }

# 0) <파일>[:시작[:길이]] 를 분해
files=(); starts=(); lens=()
for spec in "$@"; do
  IFS=':' read -r f s l <<< "$spec"
  files+=("$f")
  starts+=("${s:-0}")
  lens+=("${l:-$USE}")
done

# 1) 각 클립을 지정 구간으로 자르고 xfade 로 연쇄 연결
filter=""
for i in $(seq 0 $((${#files[@]} - 1))); do
  end=$(awk -v s="${starts[$i]}" -v l="${lens[$i]}" 'BEGIN{printf "%.3f", s+l}')
  filter+="[${i}:v]trim=${starts[$i]}:${end},setpts=PTS-STARTPTS,fps=24,format=yuv420p[c${i}];"
  echo "  [$i] $(basename "${files[$i]}")  ${starts[$i]}s ~ ${end}s"
done

prev="c0"
acc="${lens[0]}"
for i in $(seq 1 $((${#files[@]} - 1))); do
  off=$(awk -v a="$acc" -v x="$XF" 'BEGIN{printf "%.3f", a-x}')
  filter+="[${prev}][c${i}]xfade=transition=fade:duration=${XF}:offset=${off}[m${i}];"
  prev="m${i}"
  acc=$(awk -v a="$acc" -v u="${lens[$i]}" -v x="$XF" 'BEGIN{printf "%.3f", a+u-x}')
done

# 2) 루프 닫기: 꼬리 XF 초를 "머리" XF 초 위에 겹친다.
#    결과 = blend(꼬리, 머리) + 가운데. 마지막 프레임 다음이 첫 프레임으로 자연히 이어진다.
#    (꼬리를 바로 앞 구간과 겹치면 루프 지점에는 아무 효과가 없다 — 흔한 실수)
tail_start=$(awk -v a="$acc" -v x="$XF" 'BEGIN{printf "%.3f", a-x}')
wrap="$tail_start"   # 최종 길이 = 전체 - XF
filter+="[${prev}]split=3[p0][p1][p2];"
filter+="[p0]trim=0:${XF},setpts=PTS-STARTPTS[head];"
filter+="[p1]trim=${XF}:${tail_start},setpts=PTS-STARTPTS[mid];"
filter+="[p2]trim=${tail_start}:${acc},setpts=PTS-STARTPTS[tail];"
filter+="[tail][head]xfade=transition=fade:duration=${XF}:offset=0[seam];"
filter+="[seam][mid]concat=n=2:v=1:a=0[v]"

echo "클립 ${#files[@]} 개, 디졸브 ${XF}s → 루프 ${wrap}s"

inputs=()
for f in "${files[@]}"; do inputs+=(-i "$f"); done

ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" -map "[v]" \
  -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
  -movflags +faststart "$DIST/${NAME}.mp4"

ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" -map "[v]" \
  -an -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 "$DIST/${NAME}.webm"

ffmpeg -y -loglevel error -i "$DIST/${NAME}.mp4" -frames:v 1 -q:v 4 "$DIST/${NAME}-poster.jpg"

ls -lh "$DIST" | awk -v n="$NAME" 'NR>1 && $9 ~ n {printf "  %-24s %s\n", $9, $5}'
