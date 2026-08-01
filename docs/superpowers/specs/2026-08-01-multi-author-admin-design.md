# 어드민 다중 사용자 — 설계

작성일: 2026-08-01

## 배경

지금 어드민은 단일 `ADMIN_PASSWORD` 를 공유한다. 쿠키 값은 그 비밀번호의 sha256 이고 사용자 개념이 없다.
그래서 직원·강사에게 콘텐츠 작성을 맡기려면 비밀번호를 알려줘야 하고, 그 순간 교육 문의·대여 문의 내역까지 전부 열린다.

## 목표

내부 직원·강사가 각자 계정으로 로그인해 **교육과정(`courses`)** 과 **교육후기(`cases`)** 를 작성·수정한다.
문의 내역과 인사이트·가이드는 보이지 않는다.

두 콘텐츠는 이미 어드민에 작성 화면(`new/`)이 있다. 따라서 이 작업은 새 콘텐츠 타입을 만드는 일이 아니라 **인증을 단일 비밀번호에서 사람별 계정으로 바꾸는 일**이다.

## 범위 밖

요청에 없고 지금 필요하지 않다. 넣지 않는다.

- 사이트에 작성자 이름 노출
- 수정 이력 / 감사 로그
- 비밀번호 재설정 메일, 초대 링크
- 발행 승인 워크플로
- 외부 기고자, 공개 회원가입
- 인사이트·가이드를 사람이 직접 작성하는 기능 (이 둘은 `/insight-publish`, `/guide-publish` 가 만든다)

## 권한 모델

역할은 둘뿐이다.

| | 교육과정 · 교육후기 | 인사이트 · 가이드 | 문의 (교육 · 대여) | 계정 관리 |
|---|---|---|---|---|
| `admin` | 작성 · 수정 · 삭제 | 편집 · 상태변경 · 삭제 | 열람 · 상태변경 | 생성 · 비활성화 |
| `editor` | 작성 · 수정 · 삭제 | 접근 불가 | 접근 불가 | 접근 불가 |

`editor` 끼리는 서로의 글을 수정할 수 있다. 글 단위 소유권을 추적하지 않으므로 `author_id` 컬럼도, 소유자 기반 RLS 도 만들지 않는다.

## 핵심 판단 — Auth 는 신원 확인에만 쓴다

Supabase Auth 는 "이 요청자가 누구고 역할이 뭔가"에만 답한다.
실제 DB 읽기·쓰기는 지금처럼 서버에서 `getSupabaseAdmin()` (service_role) 으로 한다.

이렇게 두면 기존 RLS 정책(`status = 'published'` 만 anon 읽기)을 한 줄도 건드리지 않는다.
`auth.uid()` 기반 RLS 로 갈아타는 대안은 어드민 서버 컴포넌트의 모든 조회와 정책 전부를 다시 쓰게 만드는데, 그 대가로 얻는 것이 없다. 방어선은 지금과 같이 두 겹(프록시 + 핸들러)으로 유지한다.

## 계정 발급

`admin` 이 `/admin/members` 에서 이메일과 초기 비밀번호를 정해 계정을 만들고, 당사자에게 직접 전달한다.
서버에서 service_role 키로 `auth.admin.createUser()` 를 호출하고, 같은 요청에서 `profiles` 행을 함께 삽입한다.

초대 메일을 쓰지 않는 이유: 이 프로젝트에 메일 발송 서비스가 없다 (`docs/architecture.md` — Resend 제거됨, 대체 미정).
Supabase 기본 SMTP 는 발송량 제한이 있는 테스트용이라 운영 경로로 삼을 수 없다. 대상이 내부 인원 몇 명이므로 직접 발급이 더 확실하다.

퇴사·이탈 시에는 `profiles.is_active` 를 `false` 로 내린다. 계정 삭제는 하지 않는다.

## 데이터 모델

마이그레이션 1개를 추가한다 (`supabase/migrations/20260801130000_admin_profiles.sql`).

```
create type public.admin_role as enum ('admin', 'editor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default '',
  role public.admin_role not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- `updated_at` 은 기존 `public.set_updated_at()` 트리거를 재사용한다
- RLS 를 켜고 **anon 정책을 만들지 않는다** — service_role 로만 접근한다. 역할 정보가 브라우저에서 읽히면 안 된다

## 변경 지점

### 의존성

- `@supabase/ssr` 추가. 세션 쿠키를 서버 컴포넌트·Route Handler·`proxy.ts` 에서 읽으려면 필요하다 (현재는 `@supabase/supabase-js` 만 있다)

### 인증 코어

- `frontend/src/lib/admin-auth.ts` — 전면 교체
  - 제거: `verifyPassword()`, `makeCookieValue()`, `isValidCookieValue()`, `ADMIN_COOKIE_NAME`
  - 신규: `getCurrentUser()` → `{ id, email, name, role } | null` (세션 검증 + `profiles` 조회 + `is_active` 확인)
  - 신규: `requireRole(role)` → 미충족 시 페이지는 리다이렉트, 핸들러는 403
- `frontend/src/proxy.ts` — 비밀번호 해시 쿠키 검사를 Supabase 세션 검사로 교체. matcher `/admin/:path*` 는 유지
  - 프록시는 **로그인 여부만** 판정한다. 역할 판정은 서버에서 한다 (프록시에서 DB 를 조회하지 않는다)

### 로그인

- `frontend/src/app/api/admin/login/route.ts` — 비밀번호 1개 검증 → 이메일 + 비밀번호로 Supabase 세션 발급. 기존 rate limit (`admin-login`, 10회/분) 은 그대로 유지
- `frontend/src/app/api/admin/logout/route.ts` — 세션 파기
- `frontend/src/app/admin/login/login-form.tsx` — 이메일 입력 필드 추가

### 역할 게이트

사이드바에서 메뉴를 숨기는 것만으로는 URL 직접 입력을 막지 못한다. 서버에서 검사한다.

- `sidebar-nav.tsx` — 역할을 props 로 받아 메뉴 필터. `layout.tsx` 가 `getCurrentUser()` 결과를 내려준다
- `admin` 전용 페이지에 `requireRole('admin')` 추가:
  `insights/`, `guides/`, `inquiries/contact/`, `inquiries/rentals/`, `members/`
- `admin` 전용 핸들러에 `requireRole('admin')` 추가:
  `/api/admin/insights/[slug]`, `/api/admin/guides/[id]`, `/api/admin/inquiries/contact/[id]`, `/api/admin/inquiries/rentals/[id]`
- 로그인만 요구하는 핸들러 (두 역할 모두 허용):
  `/api/admin/courses`, `/api/admin/courses/[id]`, `/api/admin/cases`, `/api/admin/cases/[id]`, `/api/admin/upload`
  - `upload` 는 썸네일 등록에 필요하므로 `editor` 도 허용한다

### 대시보드

현재 `/admin` 은 문의 건수 카드만 보여준다. `editor` 에게는 의미가 없고 문의 건수 자체가 노출되면 안 된다.
`/admin` 을 `admin` 전용으로 두고, `editor` 로그인 시에는 `/admin/courses` 로 보낸다. 역할별 대시보드를 따로 만들지 않는다.

### 신규 화면

- `/admin/members` (`admin` 전용) — 계정 목록, 생성(이메일·이름·역할·초기 비밀번호), 활성/비활성 토글
- `/api/admin/members` + `/api/admin/members/[id]`

### 폐기

- `ADMIN_PASSWORD` 환경변수와 sha256 쿠키 경로를 제거한다. 인증 경로가 둘이면 새 역할 검사를 우회하는 구멍이 된다
- `.env.example`, `README.md`, `CLAUDE.md`, `docs/architecture.md` 의 관련 서술을 함께 고친다

## 전환 순서

기존 어드민이 잠기지 않도록 이 순서를 지킨다.

1. 마이그레이션 적용 (`profiles` 생성)
2. Supabase Studio 에서 승우님 계정을 만들고 `profiles` 에 `role = 'admin'` 행 삽입
3. 새 로그인 경로 배포
4. 로그인 확인 후 `ADMIN_PASSWORD` 제거

## 검증

테스트 스위트가 없으므로 `npm run lint && npm run build` 통과 + 수동 시나리오로 확인한다.

1. `admin` 로그인 → 기존 메뉴 전부 보이고 동작
2. `editor` 로그인 → 사이드바에 교육과정·교육후기만. 교육후기 작성·수정 성공
3. `editor` 세션으로 `/admin/inquiries/contact` 직접 입력 → 차단
4. `editor` 세션으로 `/api/admin/insights/<slug>` PATCH → 403
5. `is_active = false` 로 내린 계정으로 로그인 시도 → 거부
6. 로그아웃 후 `/admin/courses` 접근 → `/admin/login` 리다이렉트

## 결정 사항

- `editor` 는 콘텐츠를 **바로 `published` 로 올릴 수 있다.** 승인 워크플로를 두지 않는다.
  사내 인원만 쓰는 구조라 서로 신뢰를 전제한다. 운영해보고 필요해지면 그때 제한한다 —
  제한하게 되면 폼과 핸들러 양쪽에서 `editor` 의 `status` 를 `draft` 로 고정하는 작업이 추가된다
