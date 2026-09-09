# 팀 프로젝트 조별 주제 제출 페이지 — 구현 기록

작성: 2026-09-09 · 설계: [2026-09-09-team-topic-design.md](2026-09-09-team-topic-design.md)

## 구현

| 파일 | 내용 |
|---|---|
| `supabase/migrations/20260909120000_team_topics.sql` | `team_topics` (team_no PK 1~30, title, one_liner, updated_at). RLS 켜고 정책 0개 = service_role 전용 |
| `supabase/migrations/20260909130000_team_topics_free_text.sql` | v2: `topic_code` 컬럼 제거 (자유 입력 전환) |
| `supabase/migrations/20260909140000_team_topics_drop_submitted_by.sql` | 제출자 입력 제거 (`submitted_by` 컬럼 드롭) |
| `frontend/src/app/api/team-topic/route.ts` | GET 전체 현황 / POST 조 번호 기준 upsert. `rateLimit("team-topic", ip, 10, "1 m")`, 길이·범위 검증 |
| `frontend/src/app/team-topic/content.ts` | 주제 예시 10선(참고용 텍스트) + `TEAM_COUNT = 8` + `TeamTopic` 타입 + `NUM_FONT`(Jakarta 숫자 서체) |
| `frontend/src/app/team-topic/page.tsx` | 서버 페이지. 크림 히어로(제목·소개·"주제 입력하기"/"예시 보러가기" 버튼·스탯, 오른쪽 `illust/quiz-vibe.webp`) + 네이비 핵심 질문 띠 → `<TeamTopicBoard/>` → 예시 10선(`#examples`, 알파벳 모노그램) → 5단계 + 규칙 밴드. `Reveal`/`RevealList` 로 등장. `robots: noindex`, `(site)` 밖이라 헤더·푸터 없음 |
| `frontend/src/app/team-topic/board.tsx` | 클라이언트. 히어로 바로 아래 `#submit` 섹션 하나에 **왼쪽 제출 시트 + 오른쪽 조별 현황(lg 에서 sticky)**. 5초 폴링. 제출: 조 번호 타일 → 고르면 기존 제출 자동 채움 → "제출 내용 확인" → 확인 패널(기존/새 내용 비교) → 확정. 현황: 제출 카드는 주황 룰·번호, `updated_at` key 로 새 제출 fade-up, 미제출은 점선 한 줄. 하단 바는 제출 섹션이 안 보일 때만(IntersectionObserver) |

## 운영

- 링크: `https://daeasy.co.kr/team-topic`
- 조 개수 변경: `content.tsx` 의 `TEAM_COUNT`
- 행사 후 정리: `drop table public.team_topics;` + `frontend/src/app/team-topic`, `frontend/src/app/api/team-topic` 삭제 + README 표 행 제거

## 검증

- **최종 운영 E2E (2026-09-09, 레이아웃 v7 배포 후)**: API 검증 4건(조 범위 밖·잘못된 JSON·주제 누락·한 문장 누락 → 한국어 안내) / 3조 첫 제출 → 확인 패널 → 확정 → 현황 카드·"1 / 8조 제출"·DB 반영 / 제목 수정 후 재제출 → 패널에 기존(마지막 수정 시각)·새 내용 비교 → "3조 내용 바꾸고 제출" → 카드 갱신, 카운트 유지 / 히어로 "예시 보러가기" → 예시로 스크롤·하단 바 표시 → 바 버튼 → 제출로 복귀·바 숨김 / 외부(curl)에서 6조 제출 → 브라우저에 자동 반영(폴링) / 콘솔 에러 0. 테스트 행 삭제.

- `npm run lint`, `npm run build` 통과
- Playwright 데스크톱 1280 / 모바일 390 풀페이지 렌더 확인 — 공고 섹션·폼·현황 표 정상, 콘솔 에러는 테이블 미생성 시점의 `/api/team-topic` 500 뿐
- v1 운영 E2E: 제출·덮어쓰기·9조 거부 확인 후 테스트 행 삭제
- 제출 확인 패널: 로컬에서 2조 기존 행을 두고 제목 변경 → 제출 → "02조에 이미 제출된 내용을 덮어씁니다" 패널에 기존·새 내용 표시 → "네, 02조 덮어쓰기" → 저장 완료·카드 갱신 확인(submitted_by 컬럼 드롭 이후 운영 DB)
- v5 (이미지 히어로): `quiz-vibe.webp` 를 히어로에, 배경을 일러스트 바탕색 `#fefaf2` 로 맞춤(canvas 로 픽셀 샘플). 네이비를 `#1f3a93` 으로. lint·build 통과, Playwright 데스크톱 1280 / 모바일 390 풀페이지, 콘솔 에러 0
- v4 (색 재정립: 네이비 `#0b2a5b` · 하늘색 · 흰색 · 주황, 베이지·반투명 회색 제거): lint·build 통과, Playwright 데스크톱 풀페이지(테스트 행 2건 넣고 확인 후 삭제), 콘솔 에러 0
- v3 (다크 히어로·주황 강조 디자인): lint·build 통과, Playwright 데스크톱 1036 / 모바일 390 풀페이지 렌더(테스트 행 2건 넣고 제출 카드·미제출 카드 모두 확인 후 삭제), 콘솔 에러 0
- v2 (자유 입력·새 디자인): lint·build 통과, Playwright 데스크톱·모바일 렌더, 하단 바 클릭 → 폼으로 스크롤 후 바 숨김 확인. 컬럼 제거 마이그레이션 적용 후 운영 URL E2E: 3조 선택 → 제출 → 현황 카드·"1 / 8조 제출" 반영, 제목 바꿔 재제출 → 같은 카드 덮어쓰기(카운트 유지), 콘솔 에러 0. 테스트 행 삭제해 표는 비어 있음

## 남은 것

- 전용 일러스트를 만들면(ComfyUI, 네이비·주황·틸 플랫 스타일, 바탕 `#fefaf2`) `public/illust/team-topic.webp` 로 넣고 `page.tsx` 의 `src` 한 줄만 교체
