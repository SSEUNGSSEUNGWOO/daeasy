# AI 체험관 스테이션 03 레드팀 게임 — 구현 기록

작성: 2026-09-08 · 설계: [2026-09-08-redteam-station-design.md](2026-09-08-redteam-station-design.md)

## 구현

| 파일 | 내용 |
|---|---|
| `frontend/src/app/(site)/quiz/redteam/content.ts` | 라운드 5개 × 선택지 4개. `Round { vuln, bot{name,purpose,rule}, setup, options[], lesson }`, `Option { text, tag, reply, breached, why }`. 결과 화면 추천 slug 2개(`ai-literacy`, `genai-productivity`)와 이유 |
| `frontend/src/app/(site)/quiz/redteam/redteam-flow.tsx` | 클라이언트 게임. `intro → play(5) → result`. `BotReply` 가 타자기(key 로 재마운트, interval 안에서만 setState, 완료 통지는 별도 effect). 첫 선택만 `breaches[]` 에 기록, 판정 뒤 "다른 말들은 어땠을까?" 로 나머지 3개 판정 펼침 |
| `frontend/src/app/(site)/quiz/redteam/page.tsx` | 서버 페이지. `fetchCourses()` 로 추천 카드의 제목·레벨. `revalidate = 60` (01 과 동일) |
| `frontend/src/app/(site)/quiz/page.tsx` | 허브 STATION 03 을 `href: "/quiz/redteam"`, `약 3분 · 5라운드` 로 열고 결과 예시 블록(민원 챗봇 + 뚫림 배지) 추가 |

런타임 LLM 호출 없음. Vercel 환경변수 추가 없음.

## 검증

- `npm run lint` 통과, `npm run build` 통과
- Playwright 클릭 스루 (데스크톱 1280 / 모바일 390):
  - 인트로 → 1라운드 → 신분 사칭 선택 → 타자기 재생 → `뚫림 · 사회공학 — 신분 사칭` + 이유 → "다른 말들은" 펼침에 나머지 3개(막힘·막힘·뚫림)
  - 2~5라운드를 [뚫림, 뚫림, 막힘, 막힘] 으로 골라 결과 `3 / 5`, 원칙 5개의 배지가 선택 이력과 일치, 추천 카드 2개 (`/contact?course=ai-literacy`, `genai-productivity`)
  - 콘솔 에러 0 (경고 1건은 사이트 전역의 `not-found.webp` preload — 이 작업과 무관)

## 남은 것

- 허브 카드 일러스트 `/illust/quiz-redteam.webp` — 승우님 ComfyUI. 파일이 생기면 `quiz/page.tsx` 의 `STATION_ILLUST` 에 한 줄
- 시나리오 문구는 `content.ts` 에서 바로 고친다. 라운드를 늘리려면 `ROUNDS` 에 항목 추가 — 화면은 길이를 안 가정한다
