# 홈 스크롤 스토리텔링 구현 계획

> 이 계획은 같은 세션에서 작성자가 직접 실행한다 (장면 간 결합도가 높아 단일 컨텍스트 구현).
> 설계 근거: `docs/superpowers/specs/2026-08-05-home-scroll-story-design.md`

**Goal:** 전역 Lenis + 홈 7개 장면(스펙 6개 + 대관 배너 유지) 스크롤 재구성.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `frontend/src/components/smooth-scroll.tsx` (신규) | Lenis 초기화 + ScrollTrigger 동기화. reduced-motion 이면 미생성 |
| `frontend/src/components/home/scenes/gsap-setup.ts` (신규) | gsap 플러그인 등록 1곳 |
| `frontend/src/components/home/scenes/scene-hero.tsx` (신규) | 핀 + 헤드라인 후퇴 + 카운트업 + 배지. 사진 카드 패럴랙스 |
| `frontend/src/components/home/scenes/scene-partners.tsx` (신규) | 마퀴 유지 + 진입 스태거 |
| `frontend/src/components/home/scenes/scene-process.tsx` (신규) | 핵심 장면: 핀 + 4단계 순차 전환. 완화판은 현재 그리드 |
| `frontend/src/components/home/scenes/scene-courses.tsx` (신규) | 가로 레일: 데스크톱 핀+스크럽, 그 외 네이티브 가로 스크롤 |
| `frontend/src/components/home/scenes/scene-insights.tsx` (신규) | 스태거 reveal |
| `frontend/src/components/home/scenes/scene-rentals.tsx` (신규) | 대관 배너 (가벼운 reveal — 스펙 누락분 보강) |
| `frontend/src/components/home/scenes/scene-cta.tsx` (신규) | 잉크 카드 차오름 + 문구 등장 |
| `frontend/src/app/(site)/page.tsx` (재작성) | 서버 fetch + 장면 조립. `revalidate=60` 유지 |
| `frontend/src/app/(site)/layout.tsx` (수정) | `<SmoothScroll>` 래핑 |
| `frontend/src/app/globals.css` (수정) | lenis 권장 CSS 3줄 |

## 원칙 (스펙 요약)

- 분기: `gsap.matchMedia()` — reduced(정적) / `(max-width:1023px)` 완화 / 데스크톱 전체
- SSR 실값: 카운터도 최종 값을 렌더하고 클라이언트에서 0→값으로 덮음
- `transform`/`opacity` 만. `useGSAP({ scope })` 로 정리
- 데이터는 서버 page 가 직렬화 가능한 표시용 props 로 내림 (날짜 포맷·track 분리는 서버에서)

## 작업 순서

1. `npm i lenis gsap @gsap/react` + SmoothScroll + layout + globals — 빌드 그린 확인 후 커밋
2. scene-hero ~ scene-cta 구현 + page.tsx 재조립 — 장면당 완성 시점마다 빌드
3. 검증 (스펙 7항목): 데스크톱 연출 / reduced-motion 정적 / 모바일 390px / curl 로 SSR 실값
   (`10만+`·`제안서`·과정명 grep) / 서브페이지 질감만 / 어드민 무영향 / 라우트 테이블 `1m`
4. main 병합 · push · 운영 확인

## 되돌리기

장면 전환은 page.tsx 1파일 + scenes 디렉토리로 격리되므로, 문제 시
`git revert` 로 홈만 원상복구 가능. 서브페이지·어드민은 SmoothScroll 외 변경 없음.
