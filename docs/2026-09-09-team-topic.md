# 팀 프로젝트 조별 주제 제출 페이지 — 구현 기록

작성: 2026-09-09 · 설계: [2026-09-09-team-topic-design.md](2026-09-09-team-topic-design.md)

## 구현

| 파일 | 내용 |
|---|---|
| `supabase/migrations/20260909120000_team_topics.sql` | `team_topics` (team_no PK 1~30, topic_code, title, one_liner, submitted_by, updated_at). RLS 켜고 정책 0개 = service_role 전용 |
| `frontend/src/app/api/team-topic/route.ts` | GET 전체 현황 / POST 조 번호 기준 upsert. `rateLimit("team-topic", ip, 10, "1 m")`, 길이·범위 검증. A~J 는 제목 자동, NEW 는 제목 필수 |
| `frontend/src/app/team-topic/content.tsx` | 공고의 주제 10선 카드 데이터 + `TEAM_COUNT = 8` + `TeamTopic` 타입 |
| `frontend/src/app/team-topic/page.tsx` | 서버 페이지. 공고 5개 섹션(hero·주제·제출·방법론·미션). `robots: noindex`. `(site)` 밖이라 사이트 헤더·푸터 없음 |
| `frontend/src/app/team-topic/board.tsx` | 클라이언트. 15초 폴링, 주제 카드 "N조" 배지, 제출 폼(조 선택 시 기존 제출 자동 채움), 중복 주제 경고, 조별 현황 표("N조와 겹침") |
| `frontend/src/app/team-topic/team-topic.css` | 공고 CSS 를 `.tp` 로 스코프 + 1000px/560px 반응형 |

## 운영

- 링크: `https://daeasy.co.kr/team-topic`
- 조 개수 변경: `content.tsx` 의 `TEAM_COUNT`
- 행사 후 정리: `drop table public.team_topics;` + `frontend/src/app/team-topic`, `frontend/src/app/api/team-topic` 삭제 + README 표 행 제거

## 검증

- `npm run lint`, `npm run build` 통과
- Playwright 데스크톱 1280 / 모바일 390 풀페이지 렌더 확인 — 공고 섹션·폼·현황 표 정상, 콘솔 에러는 테이블 미생성 시점의 `/api/team-topic` 500 뿐
- 운영 URL E2E (마이그레이션 적용 후): 1조 A 제출 → 카드 배지 "1조"·현황 표 반영, 2조가 A 선택 시 "이미 1조가 이 주제를 골랐습니다" 경고, curl 로 같은 조 재제출 덮어쓰기·9조 거부·NEW 제목 누락 거부 확인. 테스트 행은 삭제해 표는 비어 있음
