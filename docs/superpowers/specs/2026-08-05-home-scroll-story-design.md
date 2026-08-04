# 홈 스크롤 스토리텔링 + 전역 스무스 스크롤 — 설계

작성일: 2026-08-05

## 배경

nhn.com 수준의 스크롤 연출을 도입하기로 결정 (승우님 확정). 분석 결과 NHN 의
실체는 Lenis(관성 스크롤) + GSAP ScrollTrigger(스크럽) + 핀 고정 섹션 세 가지다.
전환용 사이트라는 성격을 감안해 **홈만 전면 재구성, 서브페이지는 Lenis 질감만
공유**한다 (NHN 도 서브페이지는 평범하다).

콘텐츠(문구·숫자·배지·CTA)는 최근 다듬은 것을 그대로 쓴다. 바꾸는 것은 등장
방식과 레이아웃뿐이다.

## 목표

- 전 (site) 페이지에 Lenis 스무스 스크롤 질감
- 홈을 6개 장면의 스크롤 스토리텔링으로 재구성 (아래 장면표)
- 저사양·모바일·모션 민감 사용자에게 성능·접근성 저하 없음

## 범위 밖

- 서브페이지 장면 연출 (질감만 공유)
- 어드민 (`/admin`) — Lenis 미적용
- 콘텐츠 문구 변경
- 커스텀 커서, 페이지 전환 애니메이션, WebGL

## 의존성

- `lenis` — 전역 스무스 스크롤
- `gsap` + `@gsap/react` — ScrollTrigger 스크럽, `useGSAP` 훅

## 아키텍처

### 전역 스무스 스크롤

- `frontend/src/components/smooth-scroll.tsx` (client) — Lenis 초기화,
  `ScrollTrigger.update` 와 동기화, `gsap.ticker` 로 구동
- `(site)/layout.tsx` 에서만 감싼다. 어드민은 제외
- `prefers-reduced-motion` 이면 Lenis 를 아예 만들지 않는다

### 홈 구조

`(site)/page.tsx` 는 **서버 컴포넌트로 유지** — `fetchCourses()` /
`fetchInsights()` 와 `revalidate = 60` 을 그대로 두고, 데이터를 장면 컴포넌트에
props 로 내린다. 장면은 `src/components/home/scenes/` 아래 클라이언트 컴포넌트.

클라이언트 컴포넌트도 서버에서 1차 렌더되므로 **모든 텍스트·숫자·링크는 초기
HTML 에 실제 값으로 존재해야 한다** (SEO·no-JS 대비). 카운트업은 실제 값을
렌더한 뒤 클라이언트에서 0→값 연출로 덮는 방식 — JS 꺼져 있으면 실제 값이
그대로 보인다.

### 장면 (스크롤 순서)

| # | 컴포넌트 | 연출 | 데스크톱 | 모바일/reduced-motion |
|---|---|---|---|---|
| 1 | `scene-hero.tsx` | 핀 고정. 헤드라인+회전문구 → 스크롤 진행 시 헤드라인 축소·페이드, 실적 숫자 4개 카운트업(0→실값), 수상 배지 등장 | 핀+스크럽 | 핀 없음, 순차 reveal, 숫자 즉시 표시 |
| 2 | `scene-partners.tsx` | 기존 마퀴 + 진입 시 로고 스태거 페이드 | 스태거 | 마퀴만 (현행 유지) |
| 3 | `scene-process.tsx` | **핵심 장면.** 핀 고정, 스크롤 진행에 따라 4단계(사전 인터뷰→설계→교육→코칭) 순차 전환 | 핀+스크럽 | 핀 없음, 4단계 세로 나열 + reveal |
| 4 | `scene-courses.tsx` | 추천 과정 카드가 스크롤에 맞춰 가로로 흐르는 레일 | 가로 스크럽 | 가로 스와이프(네이티브 스크롤) |
| 5 | `scene-insights.tsx` | 기존 목록 + 스태거 reveal 강화 | reveal | reveal |
| 6 | `scene-cta.tsx` | 잉크색 배경이 차오르며 CTA 문구 등장 | 스크럽 | 단순 reveal |

### 분기 방법

`gsap.matchMedia()` 하나로 세 조건을 관리한다:
- `(prefers-reduced-motion: reduce)` → 연출 전부 없음 (정적)
- `(max-width: 1023px)` → 핀 없는 완화판
- 그 외 → 전체 연출

## 성능 가드

- 애니메이션 속성은 `transform`/`opacity` 만 (layout 유발 속성 금지)
- 각 장면의 ScrollTrigger 는 컴포넌트 unmount 시 정리 (`useGSAP` scope)
- 이미지 지연 로딩 유지, 신규 에셋 없음
- Lighthouse 모바일 성능이 재구성 전 대비 크게 떨어지면 (−10점 이상) 원인
  장면을 완화판으로 강등한다

## 검증

`npm run lint && npm run build` + 수동:

1. 데스크톱: 6개 장면 연출 동작, 히어로·프로세스 핀 진행
2. DevTools에서 `prefers-reduced-motion: reduce` 에뮬레이션 → 연출 전부 꺼지고
   정적 레이아웃, 콘텐츠 누락 없음
3. 모바일 뷰포트(390px): 핀 없음, 모든 콘텐츠 접근 가능
4. JS 비활성 상태에서 curl → 실적 숫자·CTA 문구·과정명이 HTML 에 실값으로 존재
5. `/insights` 등 서브페이지: 스무스 스크롤 질감만, 연출 없음
6. 어드민: Lenis 영향 없음
7. 홈 revalidate=60 유지 확인 (빌드 라우트 테이블 `1m`)
