# 어드민 다중 사용자 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 `ADMIN_PASSWORD` 공유 로그인을 Supabase Auth 기반 사람별 계정으로 바꾸고, `editor` 역할은 교육과정·교육후기만 다루게 한다.

**Architecture:** Supabase Auth 는 신원·역할 확인에만 쓴다. DB 읽기·쓰기는 지금처럼 서버에서 `service_role` 로 한다 — 기존 RLS 정책은 건드리지 않는다. `proxy.ts` 는 로그인 여부만 보는 optimistic check 이고, 역할 판정은 데이터에 가까운 서버 쪽(`lib/admin-auth.ts`)에서 한다.

**Tech Stack:** Next.js 16.2.6 (App Router, `proxy.ts`), React 19, `@supabase/ssr` 0.12.4, `@supabase/supabase-js` ≥2.111, Supabase Postgres + Auth, TypeScript.

**설계 근거:** `docs/superpowers/specs/2026-08-01-multi-author-admin-design.md`

---

## 이 저장소에 대해 먼저 알아야 할 것

작업 전에 읽어라. 모르면 반드시 틀리는 것들이다.

1. **테스트 러너가 없다.** jest/vitest/playwright 모두 미설치다. 이 계획은 TDD 대신 **`npm run lint && npm run build` + 브라우저 수동 검증**으로 각 태스크를 확인한다. 테스트 파일을 찾지 마라. 테스트 프레임워크를 새로 도입하지도 마라 — 승인된 스펙의 검증 방식이 아니다.
2. **`frontend/src/proxy.ts` 가 Next.js 16 의 미들웨어다.** 파일명도 export 이름도 `middleware` 가 아니라 `proxy`. `middleware.ts` 를 새로 만들면 조용히 무시된다. (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`)
3. **Next.js 16 의 proxy 는 Node.js 런타임에서 돈다.** Edge 전용 제약을 걱정할 필요 없다.
4. **공식 문서가 proxy 를 인증의 유일한 방어선으로 쓰지 말라고 명시한다.** proxy 는 쿠키만 읽고, 권한 검사는 데이터 접근부에서 한다. 이 계획은 그 구조를 따른다.
5. **`any` 금지.** `unknown` + 좁히기를 쓴다. supabase-js 조회는 `.maybeSingle<T>()` 처럼 제네릭으로 타입을 준다.
6. **`.env.local` 을 바꾸면 dev 서버를 반드시 재시작한다.** hot reload 가 안 먹는다. 멈추면 `Get-NetTCPConnection -LocalPort 3000 -State Listen` → `Stop-Process -Id <PID> -Force`.
7. **경로에 괄호가 있다.** `src/app/admin/(authed)/...` — 셸에서 다룰 때 반드시 따옴표로 감싼다.
8. 모든 명령은 `frontend/` 안에서 실행한다.

---

## 파일 구조

**신규**

| 파일 | 책임 |
|---|---|
| `supabase/migrations/20260801130000_admin_profiles.sql` | `admin_role` enum + `profiles` 테이블 + RLS |
| `frontend/src/lib/supabase-server.ts` | 요청 단위 Supabase 클라이언트 (세션 쿠키 읽기·쓰기) |
| `frontend/src/app/admin/(authed)/members/page.tsx` | 계정 목록 (admin 전용) |
| `frontend/src/app/admin/(authed)/members/member-form.tsx` | 계정 생성 폼 |
| `frontend/src/app/admin/(authed)/members/active-toggle.tsx` | 활성/비활성 토글 |
| `frontend/src/app/api/admin/members/route.ts` | 계정 생성 |
| `frontend/src/app/api/admin/members/[id]/route.ts` | 활성/비활성 변경 |

**교체 (기존 내용 대부분 사라짐)**

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/admin-auth.ts` | 비밀번호 해시 검증 → 세션·역할 조회(DAL) |
| `frontend/src/proxy.ts` | 쿠키 해시 비교 → Supabase 세션 확인 |
| `frontend/src/app/api/admin/login/route.ts` | 비밀번호 1개 → 이메일+비밀번호 |
| `frontend/src/app/api/admin/logout/route.ts` | 쿠키 만료 → `signOut()` |
| `frontend/src/app/admin/login/login-form.tsx` | 이메일 필드 추가 |

**수정 (게이트 추가)**

| 파일 | 변경 |
|---|---|
| `frontend/src/app/admin/(authed)/layout.tsx` | 사용자 조회 후 사이드바에 역할 전달 |
| `frontend/src/app/admin/(authed)/sidebar-nav.tsx` | 역할로 메뉴 필터 |
| `frontend/src/app/admin/(authed)/page.tsx` | `admin` 전용으로 잠금 |
| `insights/`, `guides/`, `inquiries/*` 페이지 4개 | `requireRole("admin")` |
| API 라우트 9개 | `isAdminAuthed()` → 역할 검사 |

---

## Task 1: 의존성 설치

**Files:**
- Modify: `frontend/package.json`, `frontend/package-lock.json`

- [ ] **Step 1: 현재 supabase-js 버전 확인**

```bash
cd frontend && node -p "require('./node_modules/@supabase/supabase-js/package.json').version"
```

예상 출력: `2.105.4`

`@supabase/ssr@0.12.4` 의 peer 의존성은 `@supabase/supabase-js@^2.111.0` 이다. 즉 설치하면 supabase-js 가 함께 올라간다. `package.json` 의 범위가 `^2.105.4` 라 자동으로 해결된다.

- [ ] **Step 2: 설치**

```bash
cd frontend && npm install @supabase/ssr@^0.12.4
```

- [ ] **Step 3: 두 패키지 버전 확인**

```bash
cd frontend && node -p "require('./node_modules/@supabase/ssr/package.json').version" && node -p "require('./node_modules/@supabase/supabase-js/package.json').version"
```

예상: `0.12.4` 그리고 `2.111.0` 이상. supabase-js 가 2.111 미만이면 `npm install @supabase/supabase-js@^2.111.0` 을 추가 실행한다.

- [ ] **Step 4: 기존 코드가 그대로 빌드되는지 확인**

```bash
cd frontend && npm run build
```

예상: 성공. supabase-js 업그레이드가 기존 호출부를 깨지 않았음을 여기서 확인한다. 실패하면 멈추고 원인을 보고한다.

- [ ] **Step 5: 커밋**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): @supabase/ssr 추가"
```

---

## Task 2: profiles 마이그레이션

**Files:**
- Create: `supabase/migrations/20260801130000_admin_profiles.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 어드민 사용자 프로필
-- 지금까지 어드민은 단일 ADMIN_PASSWORD 공유였다. 사람별 계정으로 바꾸면서
-- 신원은 auth.users 가, 역할은 이 테이블이 갖는다.
-- 데이터 접근은 계속 service_role 로 하므로 다른 테이블의 RLS 는 건드리지 않는다.

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

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS 를 켜고 정책을 하나도 만들지 않는다.
-- = anon / authenticated 는 접근 불가. service_role 만 읽고 쓴다.
-- 역할 정보가 브라우저로 새어나가면 안 된다.
alter table public.profiles enable row level security;
```

- [ ] **Step 2: Supabase Studio 에서 실행**

Supabase Studio → SQL Editor 에 위 내용을 붙여넣고 실행한다.

예상: `Success. No rows returned`

- [ ] **Step 3: 테이블 생성 확인**

Studio → Table Editor 에서 `profiles` 가 보이고, 우측에 `RLS enabled` 배지가 붙어 있는지 확인한다. Policies 탭은 비어 있어야 한다.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/20260801130000_admin_profiles.sql
git commit -m "feat(supabase): 어드민 사용자 profiles 테이블 + admin_role enum"
```

---

## Task 3: 첫 admin 계정 만들기

이걸 먼저 해두지 않으면 Task 6 이후 아무도 로그인할 수 없다.

**Files:** 없음 (Supabase Studio 작업)

- [ ] **Step 1: Auth 사용자 생성**

Studio → Authentication → Users → **Add user** → *Create new user*
- Email: 승우님 이메일
- Password: 임시 비밀번호
- **Auto Confirm User: 켠다** (메일 발송 경로가 없으므로 확인 메일을 기다릴 수 없다)

생성된 사용자의 UID 를 복사한다.

- [ ] **Step 2: profiles 행 삽입**

SQL Editor 에서 실행한다. `<UID>` 와 `<이메일>` 을 위에서 복사한 값으로 바꾼다.

```sql
insert into public.profiles (id, email, name, role)
values ('<UID>', '<이메일>', '관리자', 'admin');
```

- [ ] **Step 3: 확인**

```sql
select id, email, role, is_active from public.profiles;
```

예상: 1행, `role = admin`, `is_active = true`

---

## Task 4: 요청 단위 Supabase 클라이언트

**Files:**
- Create: `frontend/src/lib/supabase-server.ts`

- [ ] **Step 1: 파일 작성**

```ts
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다.",
  );
}

/**
 * 요청 하나에 대응하는 Supabase 클라이언트. 세션 쿠키를 읽고 쓴다.
 *
 * 서버 컴포넌트에서는 쿠키 쓰기가 막혀 있어 setAll 이 예외를 던진다.
 * 토큰 갱신은 proxy.ts 가 담당하므로 여기서는 삼킨다.
 * Route Handler 에서 호출하면 쓰기가 정상 동작한다 (로그인·로그아웃이 이걸 쓴다).
 *
 * 요청마다 새로 만든다. 절대 모듈 최상단에서 만들어 공유하지 않는다.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const store = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서 호출된 경우. proxy.ts 가 갱신을 대신 기록한다.
        }
      },
    },
  });
}
```

- [ ] **Step 2: 타입 확인**

```bash
cd frontend && npx tsc --noEmit
```

예상: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/lib/supabase-server.ts
git commit -m "feat(frontend): 요청 단위 Supabase 서버 클라이언트"
```

---

## Task 5: 인증 코어 교체 (DAL)

`lib/admin-auth.ts` 를 통째로 갈아엎는다. 기존 export 는 전부 사라지므로 이 태스크만으로는 빌드가 깨진다 — Task 6~9 까지 마쳐야 다시 통과한다.

**Files:**
- Modify: `frontend/src/lib/admin-auth.ts` (전체 교체)

- [ ] **Step 1: 파일 전체를 아래 내용으로 교체**

```ts
import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { cache } from "react";

import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const ADMIN_ROLES = ["admin", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
};

export function isAdminRole(v: unknown): v is AdminRole {
  return typeof v === "string" && (ADMIN_ROLES as readonly string[]).includes(v);
}

/** 역할별 첫 화면. editor 는 문의 대시보드(/admin)를 볼 수 없다. */
export function homeFor(role: AdminRole): string {
  return role === "admin" ? "/admin" : "/admin/courses";
}

/**
 * 현재 요청의 사용자. 로그인 안 했거나 비활성 계정이면 null.
 *
 * getUser() 는 Supabase Auth 서버에 토큰을 검증시킨다.
 * getSession() 은 쿠키를 그대로 믿기 때문에 권한 판정에 쓰면 안 된다.
 * React cache 로 한 번의 렌더 안에서는 한 번만 조회한다.
 */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("id,email,name,role,is_active")
    .eq("id", data.user.id)
    .maybeSingle<ProfileRow>();

  if (!profile || !profile.is_active) return null;
  if (!isAdminRole(profile.role)) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  };
});

/** 페이지(서버 컴포넌트)용. 미로그인이면 로그인 화면으로 보낸다. */
export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** 페이지용. 역할이 다르면 그 사람의 첫 화면으로 돌려보낸다. */
export async function requireRole(role: AdminRole): Promise<AdminUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

/** Route Handler 용 응답. 페이지처럼 리다이렉트하지 않는다. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ detail: "권한이 없습니다." }, { status: 403 });
}
```

- [ ] **Step 2: 커밋 (아직 빌드는 깨진 상태)**

```bash
git add frontend/src/lib/admin-auth.ts
git commit -m "feat(frontend): admin-auth 를 Supabase 세션 기반 DAL 로 교체"
```

---

## Task 6: proxy 교체

**Files:**
- Modify: `frontend/src/proxy.ts` (전체 교체)

- [ ] **Step 1: 파일 전체를 아래 내용으로 교체**

`setAll` 의 두 번째 인자 `headers` 는 캐시 방지 헤더다. 이걸 응답에 안 붙이면 CDN 이 한 사용자의 세션 쿠키를 다른 사용자에게 내려줄 수 있다. 반드시 붙인다.

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 로그인 여부만 본다 (optimistic check).
 * 역할 판정은 여기서 하지 않는다 — Next.js 문서가 proxy 에서 DB 조회를 하지 말라고 명시한다.
 * 역할은 각 페이지·핸들러가 lib/admin-auth.ts 로 확인한다.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, headerValue] of Object.entries(headers)) {
          response.headers.set(key, headerValue);
        }
      },
    },
  });

  // 응답이 확정되기 전에 호출해야 갱신된 토큰이 쿠키에 실린다.
  const { data } = await supabase.auth.getUser();

  if (pathname === "/admin/login") {
    if (data.user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    if (pathname !== "/admin") {
      url.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

> 로그인한 `editor` 가 `/admin/login` 에 오면 `/admin` 으로 보내지고, `/admin` 페이지가 다시 `/admin/courses` 로 보낸다 (Task 8). 한 번 더 도는 것뿐이고 무한 루프가 아니다 — `homeFor("editor")` 가 `/admin` 이 아니기 때문이다.

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/proxy.ts
git commit -m "feat(frontend): proxy 를 Supabase 세션 확인으로 교체"
```

---

## Task 7: 로그인 · 로그아웃

**Files:**
- Modify: `frontend/src/app/api/admin/login/route.ts` (전체 교체)
- Modify: `frontend/src/app/api/admin/logout/route.ts` (전체 교체)
- Modify: `frontend/src/app/admin/login/login-form.tsx`

- [ ] **Step 1: login route 전체 교체**

```ts
import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Payload = { email?: string; password?: string };

export async function POST(req: Request) {
  const rl = await rateLimit("admin-login", getClientIp(req), 10, "1 m");
  if (!rl.success) {
    return NextResponse.json(
      { detail: "잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim();
  const password = (payload.password ?? "").trim();
  if (!email || !password) {
    return NextResponse.json(
      { detail: "이메일과 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { detail: "이메일 또는 비밀번호가 일치하지 않습니다." },
      { status: 401 },
    );
  }

  // auth 인증은 됐지만 어드민 프로필이 없거나 비활성이면 들여보내지 않는다.
  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle<{ is_active: boolean }>();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { detail: "사용할 수 없는 계정입니다." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: logout route 전체 교체**

```ts
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 로그인 폼에 이메일 필드 추가**

`login-form.tsx` 에서 세 군데를 바꾼다.

state 추가 — `const [password, setPassword] = useState("");` 바로 위에:

```tsx
  const [email, setEmail] = useState("");
```

전송 본문 — `body: JSON.stringify({ password }),` 를:

```tsx
        body: JSON.stringify({ email, password }),
```

입력 필드 — `<label className="block">` 로 시작하는 비밀번호 라벨 **앞에** 아래를 넣고, 비밀번호 input 의 `autoFocus` 는 제거한다:

```tsx
      <label className="block">
        <span className="text-[13px] font-bold text-ink">이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          autoComplete="username"
          className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100"
          disabled={submitting}
        />
      </label>
```

버튼 비활성 조건 — `disabled={submitting || !password}` 를:

```tsx
        disabled={submitting || !email || !password}
```

- [ ] **Step 4: 커밋**

```bash
git add "frontend/src/app/api/admin/login/route.ts" "frontend/src/app/api/admin/logout/route.ts" "frontend/src/app/admin/login/login-form.tsx"
git commit -m "feat(frontend): 이메일+비밀번호 로그인으로 교체"
```

---

## Task 8: 레이아웃 · 사이드바 · 대시보드

**Files:**
- Modify: `frontend/src/app/admin/(authed)/layout.tsx`
- Modify: `frontend/src/app/admin/(authed)/sidebar-nav.tsx`
- Modify: `frontend/src/app/admin/(authed)/page.tsx`

- [ ] **Step 1: layout.tsx 를 아래로 교체**

```tsx
import Link from "next/link";

import { requireUser } from "@/lib/admin-auth";

import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";

export const metadata = { title: "어드민" };

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 px-4 py-6">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          daeasy admin
        </Link>
        <SidebarNav role={user.role} />
        <div className="mt-auto pt-6">
          <p className="mb-3 text-[13px] text-zinc-500">
            {user.name || user.email}
          </p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: sidebar-nav.tsx 를 아래로 교체**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminRole } from "@/lib/admin-auth";

type Item = { href: string; label: string };

const inquiryItems: Item[] = [
  { href: "/admin/inquiries/contact", label: "교육 문의" },
  { href: "/admin/inquiries/rentals", label: "대여 문의" },
];

/** editor 도 쓰는 메뉴 */
const sharedContentItems: Item[] = [
  { href: "/admin/courses", label: "교육과정" },
  { href: "/admin/cases", label: "교육 사례" },
];

/** admin 전용 메뉴 */
const adminContentItems: Item[] = [
  { href: "/admin/insights", label: "인사이트" },
  { href: "/admin/guides", label: "가이드" },
];

const settingItems: Item[] = [{ href: "/admin/members", label: "계정" }];

export function SidebarNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  const renderItem = (item: Item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={active ? "font-semibold text-ink" : "hover:text-ink"}
      >
        {item.label}
      </Link>
    );
  };

  const contentItems = isAdmin
    ? [...sharedContentItems, ...adminContentItems]
    : sharedContentItems;

  return (
    <nav className="mt-8 flex flex-col gap-2 text-sm text-zinc-600">
      {isAdmin && (
        <>
          <span className="text-xs uppercase tracking-wide text-zinc-400">문의</span>
          {inquiryItems.map(renderItem)}
        </>
      )}
      <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">콘텐츠</span>
      {contentItems.map(renderItem)}
      {isAdmin && (
        <>
          <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">설정</span>
          {settingItems.map(renderItem)}
        </>
      )}
    </nav>
  );
}
```

> `AdminRole` 은 `"server-only"` 를 import 하는 모듈에서 오지만, `import type` 이라 런타임 코드가 클라이언트 번들에 들어가지 않는다. 반드시 `import type` 으로 써라.

- [ ] **Step 3: 대시보드(`page.tsx`)를 admin 전용으로 잠근다**

`import { getSupabaseAdmin } ...` 아래에 import 를 추가하고:

```tsx
import { requireRole } from "@/lib/admin-auth";
```

`export default async function AdminHomePage() {` 의 첫 줄에 추가:

```tsx
  await requireRole("admin");
```

- [ ] **Step 4: 커밋**

```bash
git add "frontend/src/app/admin/(authed)/layout.tsx" "frontend/src/app/admin/(authed)/sidebar-nav.tsx" "frontend/src/app/admin/(authed)/page.tsx"
git commit -m "feat(frontend): 어드민 사이드바·대시보드 역할 분기"
```

---

## Task 9: admin 전용 페이지 게이트

**Files:**
- Modify: `frontend/src/app/admin/(authed)/insights/page.tsx`
- Modify: `frontend/src/app/admin/(authed)/insights/[slug]/edit/page.tsx`
- Modify: `frontend/src/app/admin/(authed)/guides/page.tsx`
- Modify: `frontend/src/app/admin/(authed)/guides/[id]/edit/page.tsx`
- Modify: `frontend/src/app/admin/(authed)/inquiries/contact/page.tsx`
- Modify: `frontend/src/app/admin/(authed)/inquiries/rentals/page.tsx`

- [ ] **Step 1: 여섯 파일 각각에 같은 두 줄을 넣는다**

import 목록에 추가:

```tsx
import { requireRole } from "@/lib/admin-auth";
```

각 파일의 `export default async function ...` 본문 **첫 줄**에 추가:

```tsx
  await requireRole("admin");
```

`[slug]/edit`, `[id]/edit` 페이지는 `params` 를 await 하는 줄보다 **앞에** 넣는다. 권한 없는 사용자가 데이터 조회를 트리거하지 못하게 한다.

- [ ] **Step 2: 여섯 곳 모두 들어갔는지 확인**

```bash
cd frontend && grep -rc "requireRole(\"admin\")" "src/app/admin/(authed)/insights" "src/app/admin/(authed)/guides" "src/app/admin/(authed)/inquiries"
```

예상: 각 파일이 `1` 로 나온다 (총 6개 파일).

- [ ] **Step 3: 커밋**

```bash
git add "frontend/src/app/admin/(authed)"
git commit -m "feat(frontend): 인사이트·가이드·문의 페이지를 admin 전용으로"
```

---

## Task 10: API 라우트 게이트

`isAdminAuthed()` 호출 14곳을 전부 바꾼다. 남겨두면 빌드가 안 된다.

**admin 전용** — `insights/[slug]`, `guides/[id]`, `inquiries/contact/[id]`, `inquiries/rentals/[id]`
**로그인만 필요 (editor 허용)** — `courses`, `courses/[id]`, `cases`, `cases/[id]`, `upload`

- [ ] **Step 1: admin 전용 4개 파일 수정**

`import { isAdminAuthed } from "@/lib/admin-auth";` 를 아래로 바꾼다:

```ts
import { forbidden, getCurrentUser, unauthorized } from "@/lib/admin-auth";
```

각 핸들러의 아래 블록을

```ts
  if (!(await isAdminAuthed())) {
```

이렇게 바꾼다 (기존 `if` 블록 전체를 아래 세 줄로 교체):

```ts
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();
```

기존 `if` 블록이 반환하던 401 응답 줄과 닫는 중괄호는 지운다.

- [ ] **Step 2: editor 허용 5개 파일 수정**

import 를 아래로 바꾼다:

```ts
import { getCurrentUser, unauthorized } from "@/lib/admin-auth";
```

각 핸들러의 `if (!(await isAdminAuthed())) { ... }` 블록을 아래 두 줄로 교체한다:

```ts
  const user = await getCurrentUser();
  if (!user) return unauthorized();
```

> `user` 변수를 쓰지 않는다고 지우지 마라 — `getCurrentUser()` 호출 자체가 검사다. 미사용 변수로 lint 가 걸리면 `if (!(await getCurrentUser())) return unauthorized();` 한 줄로 쓴다.

- [ ] **Step 3: 잔재가 없는지 확인**

```bash
cd frontend && grep -rn "isAdminAuthed\|ADMIN_COOKIE_NAME" src/ || echo "잔재 없음"
```

예상: `잔재 없음`

- [ ] **Step 4: 빌드 — 여기서 처음으로 다시 통과해야 한다**

```bash
cd frontend && npm run lint && npm run build
```

예상: 둘 다 성공. Task 5 부터 깨져 있던 빌드가 여기서 복구된다.

- [ ] **Step 5: 커밋**

```bash
git add "frontend/src/app/api/admin"
git commit -m "feat(frontend): 어드민 API 역할 검사 (insights·guides·문의는 admin 전용)"
```

---

## Task 11: 계정 관리 화면

**Files:**
- Create: `frontend/src/app/api/admin/members/route.ts`
- Create: `frontend/src/app/api/admin/members/[id]/route.ts`
- Create: `frontend/src/app/admin/(authed)/members/page.tsx`
- Create: `frontend/src/app/admin/(authed)/members/member-form.tsx`
- Create: `frontend/src/app/admin/(authed)/members/active-toggle.tsx`

- [ ] **Step 1: 생성 API**

```ts
import { NextResponse } from "next/server";

import {
  forbidden,
  getCurrentUser,
  isAdminRole,
  unauthorized,
} from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  email?: string;
  name?: string;
  role?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const name = (payload.name ?? "").trim();
  const password = payload.password ?? "";
  const role = payload.role;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { detail: "이메일 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { detail: "비밀번호는 8자 이상이어야 합니다." },
      { status: 400 },
    );
  }
  if (!isAdminRole(role)) {
    return NextResponse.json({ detail: "role 이 올바르지 않습니다." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // 메일 발송 경로가 없으므로 이메일 확인을 건너뛴다.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { detail: error?.message ?? "계정 생성에 실패했습니다." },
      { status: 400 },
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    email,
    name,
    role,
  });

  if (profileError) {
    // 프로필이 없으면 로그인해도 아무것도 못 하는 유령 계정이 된다. 되돌린다.
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ detail: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: 활성/비활성 API**

```ts
import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, unauthorized } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = { is_active?: boolean };

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { detail: "본인 계정은 비활성화할 수 없습니다." },
      { status: 400 },
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  if (typeof payload.is_active !== "boolean") {
    return NextResponse.json(
      { detail: "is_active 가 필요합니다." },
      { status: 400 },
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("profiles")
    .update({ is_active: payload.is_active })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 목록 페이지**

```tsx
import { requireRole } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

import { ActiveToggle } from "./active-toggle";
import { MemberForm } from "./member-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "계정 관리" };

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export default async function MembersPage() {
  const me = await requireRole("admin");

  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("id,email,name,role,is_active,created_at")
    .order("created_at", { ascending: true })
    .returns<Row[]>();

  const rows = data ?? [];

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">계정 관리</h1>
      <p className="mt-3 text-zinc-600">
        직원 계정을 만들고 이메일과 초기 비밀번호를 직접 전달합니다.
      </p>

      <MemberForm />

      <table className="mt-10 w-full max-w-3xl text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500">
          <tr>
            <th className="py-2 font-medium">이름</th>
            <th className="py-2 font-medium">이메일</th>
            <th className="py-2 font-medium">역할</th>
            <th className="py-2 font-medium">상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-zinc-100">
              <td className="py-3">{row.name || "-"}</td>
              <td className="py-3">{row.email}</td>
              <td className="py-3">{row.role === "admin" ? "관리자" : "직원"}</td>
              <td className="py-3">
                {row.id === me.id ? (
                  <span className="text-zinc-400">본인</span>
                ) : (
                  <ActiveToggle id={row.id} isActive={row.is_active} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 4: 생성 폼**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INPUT =
  "mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100";

export function MemberForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("editor");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `생성 실패 (${res.status})`);
      }
      setEmail("");
      setName("");
      setPassword("");
      setRole("editor");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4">
      <label className="block">
        <span className="text-[13px] font-bold text-ink">이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">이름</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">역할</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={INPUT}
          disabled={submitting}
        >
          <option value="editor">직원 (교육과정 · 교육후기만)</option>
          <option value="admin">관리자 (전체)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">초기 비밀번호 (8자 이상)</span>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        disabled={submitting || !email || !password}
        className="rounded-md bg-ink px-6 py-2.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {submitting ? "생성 중..." : "계정 만들기"}
      </button>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 5: 활성 토글**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActiveToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        isActive
          ? "rounded-md border border-zinc-200 px-3 py-1 text-[13px] hover:border-zinc-300"
          : "rounded-md border border-zinc-200 px-3 py-1 text-[13px] text-zinc-400 hover:border-zinc-300"
      }
    >
      {isActive ? "활성" : "비활성"}
    </button>
  );
}
```

- [ ] **Step 6: 빌드**

```bash
cd frontend && npm run lint && npm run build
```

예상: 둘 다 성공.

- [ ] **Step 7: 커밋**

```bash
git add "frontend/src/app/admin/(authed)/members" "frontend/src/app/api/admin/members"
git commit -m "feat(admin): 계정 관리 화면 (생성 · 활성 토글)"
```

---

## Task 12: 수동 검증

여기서 실제로 동작을 확인한다. 하나라도 실패하면 멈추고 보고한다.

**Files:** 없음

- [ ] **Step 1: dev 서버 재시작**

```bash
cd frontend && npm run dev
```

이미 떠 있으면 반드시 껐다 켠다:
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
Stop-Process -Id <PID> -Force
```

- [ ] **Step 2: admin 로그인**

`http://localhost:3000/admin` → 로그인 화면으로 리다이렉트 → Task 3 에서 만든 이메일·비밀번호로 로그인.

예상: 문의 대시보드가 뜨고 사이드바에 문의 · 콘텐츠 4개 · 계정이 모두 보인다.

- [ ] **Step 3: editor 계정 생성**

`/admin/members` → 이메일·이름·역할(직원)·비밀번호 8자 이상 입력 → 계정 만들기.

예상: 목록에 새 행이 추가된다.

- [ ] **Step 4: editor 로 로그인**

로그아웃 후 새 계정으로 로그인.

예상: `/admin/courses` 로 이동. 사이드바에 **교육과정 · 교육 사례만** 보인다. 문의 · 인사이트 · 가이드 · 계정은 없다.

- [ ] **Step 5: editor 가 글을 쓸 수 있는지**

`/admin/cases` → 새로 만들기 → 저장. 그다음 목록에서 수정 → 저장.

예상: 둘 다 성공.

- [ ] **Step 6: URL 직접 입력 차단**

editor 세션 그대로 주소창에 `http://localhost:3000/admin/inquiries/contact` 입력.

예상: `/admin/courses` 로 되돌아간다. 문의 내용이 잠깐이라도 보이면 실패다.

- [ ] **Step 7: API 직접 호출 차단**

editor 로 로그인한 브라우저의 DevTools 콘솔에서:

```js
await fetch("/api/admin/insights/x", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "draft" }),
}).then((r) => r.status)
```

예상: `403`

- [ ] **Step 8: 비활성 계정 차단**

admin 으로 다시 로그인 → `/admin/members` → editor 를 "비활성"으로 토글 → 로그아웃 → editor 로 로그인 시도.

예상: "사용할 수 없는 계정입니다." (403)

- [ ] **Step 9: 로그아웃 후 접근 차단**

로그아웃 상태에서 `http://localhost:3000/admin/courses`.

예상: `/admin/login?from=/admin/courses` 로 리다이렉트.

---

## Task 13: ADMIN_PASSWORD 폐기 · 문서 갱신

Task 12 가 전부 통과한 다음에만 한다.

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: 코드에 잔재가 없는지 확인**

```bash
cd frontend && grep -rn "ADMIN_PASSWORD" src/ || echo "코드 잔재 없음"
```

예상: `코드 잔재 없음`

- [ ] **Step 2: `.env.example` 수정**

아래 두 줄을 지운다:

```
# 어드민(/admin) 로그인 비밀번호. 쿠키는 이 값의 sha256
ADMIN_PASSWORD=
```

대신 같은 자리에 넣는다:

```
# 어드민(/admin) 로그인은 Supabase Auth 계정을 쓴다. 별도 환경변수 없음.
# 첫 관리자 계정은 Supabase Studio 에서 만들고 public.profiles 에 role='admin' 행을 넣는다.
```

- [ ] **Step 3: `README.md` 수정**

`어드민은 http://localhost:3000/admin — ADMIN_PASSWORD 로 로그인.` 을 아래로 바꾼다:

```
어드민은 `http://localhost:3000/admin` — Supabase Auth 계정으로 로그인.
첫 계정은 Studio 에서 만들고 `public.profiles` 에 `role='admin'` 행을 넣는다.
이후 계정은 `/admin/members` 에서 관리자가 발급한다.
```

- [ ] **Step 4: `CLAUDE.md` 의 "어드민 인증 / 라우트 가드" 절 교체**

세 개 불릿 중 인증 모델 불릿을 아래로 바꾼다:

```
- 인증 모델: Supabase Auth (이메일+비밀번호). 역할은 `public.profiles.role` (`admin` / `editor`) 에 있고 `lib/admin-auth.ts` 의 `getCurrentUser()` 가 세션 검증 + 프로필 조회를 한다. `editor` 는 교육과정·교육후기만 다룬다
- `proxy.ts` 는 로그인 여부만 본다 (Next.js 문서가 proxy 에서 DB 조회를 금지). 역할 판정은 페이지의 `requireRole()` 과 핸들러의 `getCurrentUser()` 가 한다
```

- [ ] **Step 5: `docs/architecture.md` 의 "인증" 절 교체**

```
## 인증

- 어드민은 Supabase Auth 계정. 역할은 `public.profiles.role` (`admin` / `editor`)
- `admin` 은 전체, `editor` 는 교육과정(`courses`)·교육후기(`cases`)만. 글 단위 소유권은 두지 않는다
- 계정 발급은 `/admin/members` 에서 `admin` 이 이메일·초기 비밀번호를 직접 만들어 전달한다
  (메일 발송 서비스가 없어 초대 메일을 쓸 수 없다)
- 이탈자는 `profiles.is_active = false` 로 내린다. 계정을 지우지 않는다
- Supabase Auth 는 신원·역할 확인에만 쓴다. 데이터 접근은 계속 service_role 경로다
```

- [ ] **Step 6: Vercel 환경변수 정리 안내**

`CLAUDE.md` 의 "Vercel 환경변수" 목록에서 `ADMIN_PASSWORD` 가 있으면 지운다.
**Vercel 대시보드에서도 `ADMIN_PASSWORD` 를 삭제해야 한다** — 코드에서 안 읽으므로 남아 있어도 동작엔 영향이 없지만, 죽은 비밀값을 남기지 않는다. 이건 승우님이 직접 해야 하는 작업이므로 완료 보고에 포함한다.

- [ ] **Step 7: 최종 빌드**

```bash
cd frontend && npm run lint && npm run build
```

예상: 둘 다 성공.

- [ ] **Step 8: 커밋**

```bash
git add .env.example README.md CLAUDE.md docs/architecture.md
git commit -m "docs: ADMIN_PASSWORD 폐기 · Supabase Auth 기반 어드민 인증 반영"
```

---

## 완료 조건

- `npm run lint`, `npm run build` 통과
- Task 12 의 9개 시나리오 전부 통과
- `grep -rn "isAdminAuthed\|ADMIN_COOKIE_NAME\|ADMIN_PASSWORD" frontend/src/` 결과 없음
- 승우님에게 보고할 것: Vercel 환경변수에서 `ADMIN_PASSWORD` 수동 삭제 필요
