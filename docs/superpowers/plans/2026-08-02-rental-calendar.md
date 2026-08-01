# 대관 예약 현황 캘린더 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/rentals` 에 월 단위 예약 현황 캘린더를 붙이고, `admin` 이 어드민에서 확정 예약을 등록·삭제하게 한다.

**Architecture:** 새 `rental_bookings` 테이블(RLS 켜고 정책 0 = service_role 전용). 공개 페이지는 서버 컴포넌트가 `booking_date, slot` 두 컬럼만 뽑아 클라이언트 캘린더에 props 로 내린다 — 내부용 `memo` 는 서버 밖으로 안 나간다. 어드민 쓰기는 기존 `getCurrentUser()` + `forbidden()` 가드 패턴.

**Tech Stack:** Next.js 16.2.6 App Router, TypeScript, Tailwind, supabase-js (service_role), 외부 캘린더 라이브러리 없음.

**설계 근거:** `docs/superpowers/specs/2026-08-02-rental-calendar-design.md`

---

## 이 저장소에 대해 먼저 알아야 할 것

1. **테스트 러너가 없다.** 검증은 `npm run lint && npm run build` + 수동 시나리오다. 테스트 프레임워크를 도입하지 마라.
2. **`any` 금지.** `unknown` + 좁히기, supabase-js 는 `.returns<T>()` / `.maybeSingle<T>()` 제네릭.
3. 경로에 괄호가 있다 (`src/app/(site)/`, `src/app/admin/(authed)/`) — 셸에서 따옴표 필수.
4. npm 명령은 `frontend/` 안에서. DB 적용 스크립트는 `ai-service/` 안에서 `uv run`.
5. `frontend/src/lib/admin-auth.ts` 가 제공하는 것: `getCurrentUser()`, `unauthorized()`, `forbidden()`, `requireRole("admin")`, `type AdminRole`. 어드민 API 가드는 반드시 이 모듈로.
6. 스타일 토큰: `text-ink`, `bg-ink`, `text-accent`, zinc 계열. 기존 화면과 같은 클래스 패턴을 쓴다.
7. 서버 전용 모듈의 타입을 클라이언트 컴포넌트에서 쓸 때는 **`import type`** (런타임 코드가 번들에 안 들어감 — `sidebar-nav.tsx` 의 기존 패턴).
8. 한 태스크가 끝날 때마다 커밋. 커밋 메시지는 각 태스크에 명시된 것을 그대로.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `supabase/migrations/20260802120000_rental_bookings.sql` (신규) | enum + 테이블 + RLS |
| `frontend/src/lib/rental-bookings.ts` (신규) | 타입 · 공개용 조회(날짜·슬롯만) · 어드민용 조회(memo 포함) |
| `frontend/src/app/(site)/rentals/booking-calendar.tsx` (신규) | 클라이언트 월 캘린더 |
| `frontend/src/app/(site)/rentals/page.tsx` (수정) | revalidate + 예약 현황 섹션 |
| `frontend/src/app/api/admin/rental-bookings/route.ts` (신규) | POST (충돌 검사 → 409) |
| `frontend/src/app/api/admin/rental-bookings/[id]/route.ts` (신규) | DELETE |
| `frontend/src/app/admin/(authed)/rental-schedule/page.tsx` (신규) | admin 전용 관리 화면 (월 이동 = `?month=` 쿼리) |
| `frontend/src/app/admin/(authed)/rental-schedule/booking-form.tsx` (신규) | 추가 폼 |
| `frontend/src/app/admin/(authed)/rental-schedule/delete-button.tsx` (신규) | 삭제 버튼 |
| `frontend/src/app/admin/(authed)/sidebar-nav.tsx` (수정) | 문의 그룹에 "대관 일정" |
| `supabase/README.md` (수정) | 테이블 표 + RLS 요약에 한 줄씩 |

---

## Task 1: 마이그레이션 작성 + 서울 DB 적용

**Files:**
- Create: `supabase/migrations/20260802120000_rental_bookings.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 강의실 대관 확정 예약 (예약 현황 캘린더의 데이터원)
-- rental_inquiries(신청)와 별개다. 전화로 성사된 예약도 어드민이 여기 등록한다.

create type public.rental_slot as enum ('full', 'am', 'pm');

create table public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_date date not null,
  slot public.rental_slot not null,
  memo text not null default '',   -- 내부용. 사이트에 절대 노출하지 않는다
  created_at timestamptz not null default now()
);
create index rental_bookings_date_idx on public.rental_bookings (booking_date);

-- profiles 패턴: RLS 켜고 정책 0개 = anon/authenticated 차단, service_role 전용.
-- 공개 노출은 서버 컴포넌트가 booking_date, slot 두 컬럼만 뽑아 내려준다.
alter table public.rental_bookings enable row level security;

-- 같은 날 중복 규칙(full ↔ am/pm 충돌)은 unique 로 표현이 안 되므로 API 에서 검사한다.
-- 같은 슬롯 중복만 DB 가 막는다.
create unique index rental_bookings_date_slot_key
  on public.rental_bookings (booking_date, slot);
```

- [ ] **Step 2: 서울 DB 에 적용**

`ai-service/.env` 의 `DATABASE_URL` 이 이미 서울 프로젝트 Session pooler 를 가리킨다.

```bash
cd ai-service && PYTHONIOENCODING=utf-8 uv run python -c "
import os
from pathlib import Path
import psycopg2
from dotenv import load_dotenv
load_dotenv(Path(r'C:\Dev\kbrain\daeasy')/'ai-service'/'.env', override=True)
sql = (Path(r'C:\Dev\kbrain\daeasy')/'supabase'/'migrations'/'20260802120000_rental_bookings.sql').read_text(encoding='utf-8')
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()
cur.execute(\"select to_regclass('public.rental_bookings') is not null\")
if cur.fetchone()[0]:
    print('SKIP: 이미 존재')
else:
    cur.execute(sql); conn.commit(); print('APPLIED')
cur.execute(\"select relrowsecurity from pg_class where oid='public.rental_bookings'::regclass\")
print('RLS:', cur.fetchone()[0])
cur.execute(\"select count(*) from pg_policies where schemaname='public' and tablename='rental_bookings'\")
print('정책 수(0 이어야):', cur.fetchone()[0])
conn.close()
"
```

예상 출력: `APPLIED` / `RLS: True` / `정책 수(0 이어야): 0`

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260802120000_rental_bookings.sql
git commit -m "feat(supabase): rental_bookings 테이블 (대관 확정 예약)"
```

---

## Task 2: 조회 lib

**Files:**
- Create: `frontend/src/lib/rental-bookings.ts`

- [ ] **Step 1: 파일 작성**

```ts
import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";

export const RENTAL_SLOTS = ["full", "am", "pm"] as const;
export type RentalSlot = (typeof RENTAL_SLOTS)[number];

export function isRentalSlot(v: unknown): v is RentalSlot {
  return typeof v === "string" && (RENTAL_SLOTS as readonly string[]).includes(v);
}

export const RENTAL_SLOT_LABEL: Record<RentalSlot, string> = {
  full: "전일",
  am: "오전",
  pm: "오후",
};

/** 공개 캘린더용 — memo 를 제외한 두 컬럼만 내보낸다 */
export type PublicBooking = {
  booking_date: string; // YYYY-MM-DD
  slot: RentalSlot;
};

export type AdminBooking = PublicBooking & {
  id: string;
  memo: string;
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 오늘부터 monthsAhead 개월치. 공개 페이지(rentals) 전용. */
export async function fetchPublicBookings(
  monthsAhead = 3,
): Promise<PublicBooking[]> {
  const from = new Date();
  const to = new Date(from);
  to.setMonth(to.getMonth() + monthsAhead);

  const { data, error } = await getSupabaseAdmin()
    .from("rental_bookings")
    .select("booking_date,slot")
    .gte("booking_date", ymd(from))
    .lte("booking_date", ymd(to))
    .returns<PublicBooking[]>();

  if (error) return [];
  return data ?? [];
}

/** 어드민 화면용 — 특정 월(YYYY-MM)의 예약 전체 (memo 포함). */
export async function fetchBookingsForMonth(
  month: string,
): Promise<AdminBooking[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("rental_bookings")
    .select("id,booking_date,slot,memo")
    .gte("booking_date", `${month}-01`)
    .lt(
      "booking_date",
      // 다음 달 1일 (12월이면 이듬해 1월)
      (() => {
        const [y, m] = month.split("-").map(Number);
        const next = new Date(Date.UTC(y!, m!, 1));
        return ymd(next);
      })(),
    )
    .order("booking_date", { ascending: true })
    .returns<AdminBooking[]>();

  if (error) return [];
  return data ?? [];
}
```

- [ ] **Step 2: 타입 확인**

```bash
cd frontend && npx tsc --noEmit
```

예상: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/lib/rental-bookings.ts
git commit -m "feat(frontend): rental_bookings 조회 lib (공개용은 memo 제외)"
```

---

## Task 3: 공개 캘린더 컴포넌트 + rentals 페이지

**Files:**
- Create: `frontend/src/app/(site)/rentals/booking-calendar.tsx`
- Modify: `frontend/src/app/(site)/rentals/page.tsx`

- [ ] **Step 1: 캘린더 컴포넌트 작성**

날짜 상태: `full` 또는 `am`+`pm` → 마감 / `am` 만 → 오전 예약 / `pm` 만 → 오후 예약 / 없음 → 가능.

```tsx
"use client";

import { useMemo, useState } from "react";

import type { PublicBooking, RentalSlot } from "@/lib/rental-bookings";

type DayStatus = "available" | "am" | "pm" | "closed";

const STATUS_LABEL: Record<Exclude<DayStatus, "available">, string> = {
  am: "오전 예약",
  pm: "오후 예약",
  closed: "마감",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function statusOf(slots: Set<RentalSlot> | undefined): DayStatus {
  if (!slots || slots.size === 0) return "available";
  if (slots.has("full") || (slots.has("am") && slots.has("pm"))) return "closed";
  if (slots.has("am")) return "am";
  return "pm";
}

export function BookingCalendar({
  bookings,
  monthsAhead = 3,
}: {
  bookings: PublicBooking[];
  monthsAhead?: number;
}) {
  const [offset, setOffset] = useState(0);

  const byDate = useMemo(() => {
    const map = new Map<string, Set<RentalSlot>>();
    for (const b of bookings) {
      const set = map.get(b.booking_date) ?? new Set<RentalSlot>();
      set.add(b.slot);
      map.set(b.booking_date, set);
    }
    return map;
  }, [bookings]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + offset;
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: Array<{ day: number; ymd: string } | null> = [];
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ymd = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, ymd });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-bold tracking-[-0.01em] text-ink">
          {first.getFullYear()}년 {first.getMonth() + 1}월
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOffset((v) => Math.max(0, v - 1))}
            disabled={offset === 0}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            이전 달
          </button>
          <button
            type="button"
            onClick={() => setOffset((v) => Math.min(monthsAhead - 1, v + 1))}
            disabled={offset >= monthsAhead - 1}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            다음 달
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-[12px] font-bold uppercase tracking-wide text-zinc-400">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const past = cell.ymd < todayYmd;
          const status = statusOf(byDate.get(cell.ymd));
          return (
            <div
              key={cell.ymd}
              className={
                past
                  ? "min-h-16 rounded-lg bg-zinc-50 p-2 text-left text-zinc-300"
                  : status === "closed"
                    ? "min-h-16 rounded-lg bg-zinc-100 p-2 text-left"
                    : "min-h-16 rounded-lg border border-zinc-100 p-2 text-left"
              }
            >
              <p className={past ? "text-[13px]" : "text-[13px] font-semibold text-ink"}>
                {cell.day}
              </p>
              {!past && status !== "available" && (
                <p
                  className={
                    status === "closed"
                      ? "mt-1 text-[11px] font-bold text-zinc-400"
                      : "mt-1 text-[11px] font-bold text-accent-warm"
                  }
                >
                  {STATUS_LABEL[status]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[12.5px] text-zinc-500">
        표시가 없는 날짜는 예약 가능합니다. 오전·오후 예약일은 나머지 시간대 이용이 가능합니다.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: rentals 페이지 수정 — 세 군데**

(a) import 에 추가 (`import { RentalForm } from "./rental-form";` 아래):

```tsx
import { BookingCalendar } from "./booking-calendar";
import { fetchPublicBookings } from "@/lib/rental-bookings";
```

(b) `export const metadata = {` **위에** 추가:

```tsx
// 어드민이 등록한 예약 현황이 재배포 없이 반영되도록
export const revalidate = 60;
```

(c) 페이지 컴포넌트를 async 로 바꾸고 데이터를 조회한다. 기존
`export default function RentalsPage() {` 를:

```tsx
export default async function RentalsPage() {
  const bookings = await fetchPublicBookings();
```

로 바꾸고, `{/* 신청 폼 */}` 주석 **바로 위**에 섹션 삽입:

```tsx
      {/* 예약 현황 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Availability
          </p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            예약 현황.
          </h2>
          <div className="mt-10 max-w-3xl">
            <BookingCalendar bookings={bookings} />
          </div>
        </div>
      </section>
```

- [ ] **Step 3: 빌드 확인**

```bash
cd frontend && npm run lint && npm run build
```

예상: 성공. 라우트 테이블에서 `/rentals` 가 `1m` 재검증으로 표시.

- [ ] **Step 4: 커밋**

```bash
git add "frontend/src/app/(site)/rentals"
git commit -m "feat(frontend): 대관 페이지 예약 현황 캘린더"
```

---

## Task 4: 어드민 API

**Files:**
- Create: `frontend/src/app/api/admin/rental-bookings/route.ts`
- Create: `frontend/src/app/api/admin/rental-bookings/[id]/route.ts`

- [ ] **Step 1: POST (추가 + 충돌 검사)**

```ts
import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, unauthorized } from "@/lib/admin-auth";
import { isRentalSlot, type RentalSlot } from "@/lib/rental-bookings";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  booking_date?: string;
  slot?: string;
  memo?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

  const bookingDate = payload.booking_date ?? "";
  if (!DATE_RE.test(bookingDate)) {
    return NextResponse.json({ detail: "날짜가 올바르지 않습니다." }, { status: 400 });
  }
  if (!isRentalSlot(payload.slot)) {
    return NextResponse.json({ detail: "시간대가 올바르지 않습니다." }, { status: 400 });
  }
  const slot: RentalSlot = payload.slot;
  const memo = (payload.memo ?? "").slice(0, 500);

  const sb = getSupabaseAdmin();

  // 같은 날 충돌 규칙: full 있으면 전부 불가 / am+pm 있으면 full 불가 / 같은 슬롯 불가
  const { data: existing, error: readError } = await sb
    .from("rental_bookings")
    .select("slot")
    .eq("booking_date", bookingDate)
    .returns<{ slot: RentalSlot }[]>();

  if (readError) {
    return NextResponse.json({ detail: readError.message }, { status: 500 });
  }
  const slots = new Set((existing ?? []).map((r) => r.slot));
  const conflict =
    slots.has("full") ||
    slots.has(slot) ||
    (slot === "full" && slots.size > 0);
  if (conflict) {
    return NextResponse.json(
      { detail: "이미 예약이 있는 시간대입니다." },
      { status: 409 },
    );
  }

  const { error } = await sb
    .from("rental_bookings")
    .insert({ booking_date: bookingDate, slot, memo });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 2: DELETE**

```ts
import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, unauthorized } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from("rental_bookings")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 타입 확인 후 커밋**

```bash
cd frontend && npx tsc --noEmit
git add frontend/src/app/api/admin/rental-bookings
git commit -m "feat(admin): 대관 예약 API (충돌 검사 포함)"
```

---

## Task 5: 어드민 화면 + 사이드바

**Files:**
- Create: `frontend/src/app/admin/(authed)/rental-schedule/page.tsx`
- Create: `frontend/src/app/admin/(authed)/rental-schedule/booking-form.tsx`
- Create: `frontend/src/app/admin/(authed)/rental-schedule/delete-button.tsx`
- Modify: `frontend/src/app/admin/(authed)/sidebar-nav.tsx`

- [ ] **Step 1: 관리 페이지 (월 이동 = `?month=YYYY-MM` 쿼리)**

```tsx
import Link from "next/link";

import { requireRole } from "@/lib/admin-auth";
import {
  fetchBookingsForMonth,
  RENTAL_SLOT_LABEL,
} from "@/lib/rental-bookings";

import { BookingForm } from "./booking-form";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "대관 일정" };

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function RentalSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireRole("admin");

  const sp = await searchParams;
  const month = sp.month && MONTH_RE.test(sp.month) ? sp.month : currentMonth();
  const bookings = await fetchBookingsForMonth(month);

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">대관 일정</h1>
      <p className="mt-3 text-zinc-600">
        확정된 예약을 등록하면 사이트 예약 현황 캘린더에 반영됩니다 (전화 예약 포함).
      </p>

      <BookingForm />

      <div className="mt-12 flex items-center gap-4">
        <Link
          href={`/admin/rental-schedule?month=${shiftMonth(month, -1)}`}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 hover:border-zinc-300"
        >
          이전 달
        </Link>
        <p className="text-[15px] font-bold text-ink">{month}</p>
        <Link
          href={`/admin/rental-schedule?month=${shiftMonth(month, 1)}`}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 hover:border-zinc-300"
        >
          다음 달
        </Link>
      </div>

      <table className="mt-6 w-full max-w-2xl text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500">
          <tr>
            <th className="py-2 font-medium">날짜</th>
            <th className="py-2 font-medium">시간대</th>
            <th className="py-2 font-medium">메모</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-zinc-400">
                이 달에 등록된 예약이 없습니다.
              </td>
            </tr>
          )}
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-zinc-100">
              <td className="py-3">{b.booking_date}</td>
              <td className="py-3">{RENTAL_SLOT_LABEL[b.slot]}</td>
              <td className="py-3 text-zinc-600">{b.memo || "-"}</td>
              <td className="py-3 text-right">
                <DeleteButton id={b.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 2: 추가 폼**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INPUT =
  "mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100";

export function BookingForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("full");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/rental-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_date: date, slot, memo }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `등록 실패 (${res.status})`);
      }
      setDate("");
      setSlot("full");
      setMemo("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-2xl flex-wrap items-end gap-4">
      <label className="block">
        <span className="text-[13px] font-bold text-ink">날짜</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">시간대</span>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className={INPUT}
          disabled={submitting}
        >
          <option value="full">전일</option>
          <option value="am">오전</option>
          <option value="pm">오후</option>
        </select>
      </label>
      <label className="block flex-1 min-w-48">
        <span className="text-[13px] font-bold text-ink">메모 (내부용)</span>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: OO기관 30명"
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        disabled={submitting || !date}
        className="rounded-md bg-ink px-6 py-2.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {submitting ? "등록 중..." : "등록"}
      </button>
      {error && <p className="w-full text-[13px] text-red-600">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 3: 삭제 버튼**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("이 예약을 삭제할까요?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/rental-bookings/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="rounded-md border border-zinc-200 px-3 py-1 text-[13px] text-zinc-600 hover:border-zinc-300 hover:text-red-600"
    >
      삭제
    </button>
  );
}
```

- [ ] **Step 4: 사이드바 — `inquiryItems` 에 항목 추가**

`sidebar-nav.tsx` 의:

```tsx
const inquiryItems: Item[] = [
  { href: "/admin/inquiries/contact", label: "교육 문의" },
  { href: "/admin/inquiries/rentals", label: "대관 문의" },
];
```

를:

```tsx
const inquiryItems: Item[] = [
  { href: "/admin/inquiries/contact", label: "교육 문의" },
  { href: "/admin/inquiries/rentals", label: "대관 문의" },
  { href: "/admin/rental-schedule", label: "대관 일정" },
];
```

로 바꾼다. 문의 그룹은 이미 `isAdmin` 일 때만 렌더되므로 editor 에겐 안 보인다.

- [ ] **Step 5: 빌드 확인 후 커밋**

```bash
cd frontend && npm run lint && npm run build
git add "frontend/src/app/admin/(authed)"
git commit -m "feat(admin): 대관 일정 관리 화면 (admin 전용)"
```

---

## Task 6: 문서 갱신

**Files:**
- Modify: `supabase/README.md`

- [ ] **Step 1: 테이블 표에 한 줄 추가** (`rental_inquiries` 행 아래)

```
| `rental_bookings` | 대관 확정 예약 (예약 현황 캘린더) | 어드민 `/admin/rental-schedule` |
```

- [ ] **Step 2: RLS 요약에 한 줄 추가** (`profiles` 불릿 아래)

```
- `rental_bookings` — `profiles` 와 같은 패턴 (정책 0개, service_role 전용). 공개 캘린더는 서버가 날짜·슬롯만 내려준다
```

- [ ] **Step 3: 커밋**

```bash
git add supabase/README.md
git commit -m "docs(supabase): rental_bookings 테이블 문서화"
```

---

## Task 7: 수동 검증 (스펙의 5개 시나리오)

**Files:** 없음. dev 서버 필요 (`cd frontend && npm run dev`).

- [ ] **Step 1:** admin 으로 로그인 → `/admin/rental-schedule` 에서 서로 다른 3날짜에 전일/오전/오후 각 1건 등록 → `/rentals` 캘린더에 마감 1일·오전 예약 1일·오후 예약 1일 표시
- [ ] **Step 2:** 전일 등록된 날에 오전 추가 시도 → "이미 예약이 있는 시간대입니다." (409). 오전 등록된 날에 전일 추가 시도 → 409
- [ ] **Step 3:** 1건 삭제 → 어드민 목록에서 즉시, `/rentals` 에서 60초 내 사라짐
- [ ] **Step 4:** editor 계정으로 로그인 → 사이드바에 "대관 일정" 없음, `/admin/rental-schedule` 직접 접근 시 `/admin/courses` 로 리다이렉트, `POST /api/admin/rental-bookings` → 403
- [ ] **Step 5:** memo 에 고유 문자열(예: `MEMO-LEAK-CHECK`)로 1건 등록 → `curl -s http://localhost:3000/rentals | grep MEMO-LEAK-CHECK` 결과 없음
- [ ] **Step 6:** 검증 중 만든 데이터 전부 삭제

---

## 완료 조건

- `npm run lint && npm run build` 통과
- Task 7 시나리오 전부 통과
- `main` 병합 후 push → 운영에서 `/rentals` 캘린더 렌더 확인
