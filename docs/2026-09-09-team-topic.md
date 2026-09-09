# 팀 프로젝트 조별 주제 제출 페이지 — 구현 기록

작성: 2026-09-09 · 설계: [2026-09-09-team-topic-design.md](2026-09-09-team-topic-design.md)

## 구현

| 파일 | 내용 |
|---|---|
| `supabase/migrations/20260909120000_team_topics.sql` | `team_topics` (team_no PK 1~30, title, one_liner, submitted_by, updated_at). RLS 켜고 정책 0개 = service_role 전용 |
| `supabase/migrations/20260909130000_team_topics_free_text.sql` | v2: `topic_code` 컬럼 제거 (자유 입력 전환) |
| `frontend/src/app/api/team-topic/route.ts` | GET 전체 현황 / POST 조 번호 기준 upsert. `rateLimit("team-topic", ip, 10, "1 m")`, 길이·범위 검증 |
| `frontend/src/app/team-topic/content.ts` | 주제 예시 10선(참고용 텍스트) + `TEAM_COUNT = 8` + `TeamTopic` 타입 |
| `frontend/src/app/team-topic/page.tsx` | 서버 페이지. 헤더(핵심 질문 카드) → 예시 10선 → 5단계·공통 규칙. Tailwind, `robots: noindex`, `(site)` 밖이라 헤더·푸터 없음 |
| `frontend/src/app/team-topic/board.tsx` | 클라이언트. 15초 폴링, 조별 현황 카드(제출 전은 점선), 제출 폼(조는 세그먼트 버튼, 고르면 기존 제출 자동 채움), 반투명 하단 고정 바(폼이 보이면 IntersectionObserver 로 숨김, reduced-motion 시 즉시 스크롤) |

## 운영

- 링크: `https://daeasy.co.kr/team-topic`
- 조 개수 변경: `content.tsx` 의 `TEAM_COUNT`
- 행사 후 정리: `drop table public.team_topics;` + `frontend/src/app/team-topic`, `frontend/src/app/api/team-topic` 삭제 + README 표 행 제거

## 검증

- `npm run lint`, `npm run build` 통과
- Playwright 데스크톱 1280 / 모바일 390 풀페이지 렌더 확인 — 공고 섹션·폼·현황 표 정상, 콘솔 에러는 테이블 미생성 시점의 `/api/team-topic` 500 뿐
- v1 운영 E2E: 제출·덮어쓰기·9조 거부 확인 후 테스트 행 삭제
- v2 (자유 입력·새 디자인): lint·build 통과, Playwright 데스크톱·모바일 렌더, 하단 바 클릭 → 폼으로 스크롤 후 바 숨김 확인. 제출 E2E 는 `topic_code` 컬럼 제거 마이그레이션 적용 후 운영 URL 로
