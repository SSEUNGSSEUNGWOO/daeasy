# 아키텍처 메모

변경 시 같이 업데이트.

## 데이터 흐름

```
브라우저
  ├── 공개 페이지 (Next.js 서버 컴포넌트)
  │     ├─→ supabase-js (anon key)          : 공개 콘텐츠 읽기 — RLS 가 published 만 노출
  │     └─→ /api/* (Route Handler)          : 문의 · 대여 · 구독 · 조회수 · 좋아요 쓰기
  │           └─→ supabase-js (service_role) : 검증 · rate limit 통과 후 INSERT
  │
  └── 어드민 (/admin, Next.js)
        ├── proxy.ts 가 쿠키 검사 후 미인증이면 /admin/login 리다이렉트
        ├── 목록 · 상세는 서버 컴포넌트에서 service_role 직접 조회 (draft 포함)
        └─→ /api/admin/* (Route Handler)     : 각 핸들러가 isAdminAuthed() 재검증 후 mutation

로컬 (배포 없음)
  └── ai-service
        ├─→ psycopg2 direct (Session pooler URL) : insights INSERT — RLS 우회
        └─→ supabase-py (service_role)           : guides upsert
```

## 책임 분리

- **Next.js (frontend)**: UI, 라우팅, SEO, 캐싱, anon 읽기, 그리고 **모든 서버 사이드 mutation**
  (Route Handler 가 옛 FastAPI 백엔드의 역할을 대신한다)
- **Supabase**: PostgreSQL + Storage. RLS 로 anon 접근 제어
- **ai-service**: 콘텐츠 생성 · 평가 후 DB 적재. 사용자 요청 경로에 끼지 않는다

## 보안 원칙

- `service_role` 키는 서버에서만 사용한다. `getSupabaseAdmin()` 은 `lib/supabase.ts` 안에 있고,
  호출부는 Route Handler 와 어드민 서버 컴포넌트로 제한한다. 클라이언트 번들에 절대 노출 금지
- 브라우저에 나가는 코드는 `anon` 키만 쓴다. RLS 가 1차 방어선
- 어드민 보호는 두 겹: `proxy.ts` 의 라우트 가드 + 각 `/api/admin/*` 핸들러의 `isAdminAuthed()`
  (프록시만 믿지 않는다)
- 공개 쓰기 엔드포인트(문의 · 대여 · 구독 · 업로드)는 `lib/rate-limit.ts` 를 통과해야 한다

## 인증

- 어드민은 단일 `ADMIN_PASSWORD`. 쿠키 값은 그 비밀번호의 sha256, 비교는 `timingSafeEqual`
- 세션 개념이 없어 개별 쿠키 폐기는 불가능하다 — 유출 시 `ADMIN_PASSWORD` 를 교체해 전체 무효화한다
- 운영자가 늘어나면 Supabase Auth + role 컬럼으로 옮기는 것이 다음 단계

## 캐싱

- 인사이트 목록 · 상세는 `revalidate = 60` (ISR)
- 어드민 페이지는 `dynamic = "force-dynamic"` — 항상 최신 상태를 본다

## 미정사항

- 뉴스레터 발송 서비스 (Resend 는 제거됨 — 재도입 / SES / NHN Cloud 중 미정)
- `newsletter_issues` 발송 트리거 위치 (어드민 UI vs 스케줄러)
