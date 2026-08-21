# 문의 채널 회원 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 문의 유도 지점에서 전화번호를 걷어내고, 로그인 회원의 문의를 계정에 연결해 마이페이지에서 진행 상황을 볼 수 있게 한다. 비회원 문의 경로는 지금과 동일하게 유지한다.

**Architecture:** 기존 폼·어드민 구조를 유지한 채 두 문의 테이블에 `user_id`를 추가하고, Route Handler가 세션에서 이를 주입한다. 폼 자동 채움은 `/rentals`의 ISR을 지키기 위해 서버가 아닌 클라이언트에서 `/api/auth/me`로 수행한다. 연락처 문자열은 `lib/site.ts` 한 곳으로 모은다.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Tailwind · Supabase (Auth + Postgres, service_role 경유 쓰기/조회)

**Spec:** `docs/superpowers/specs/2026-08-21-inquiry-channel-member-linkage-design.md`

---

## 이 프로젝트의 검증 방식 — 먼저 읽을 것

**이 저장소에는 테스트 스위트가 없다.** jest·vitest·playwright 모두 미도입이며, `frontend/CLAUDE.md`가 명시적으로 "단위 테스트를 찾지 말고 `npm run lint && npm run build` 두 개로 확인한다"고 지시한다. **테스트 러너를 새로 도입하지 말 것** — 이 계획의 범위가 아니다.

따라서 각 태스크의 검증은 다음 두 단계다.

1. `cd frontend && npm run lint && npm run build` — 반드시 통과
2. 태스크에 적힌 **수동 확인 절차**를 그대로 수행

`npm run dev` 재시작이 필요한 경우가 있다. Turbopack이 옛 응답을 물고 있으면:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen   # PID 확인
Stop-Process -Id <PID> -Force
cd frontend; npm run dev
```

---

## File Structure

**생성**

| 경로 | 책임 |
|---|---|
| `supabase/migrations/20260821120000_inquiry_user_linkage.sql` | 두 문의 테이블에 `user_id`, `customer_profiles`에 `marketing_agreed_at` 추가 |
| `frontend/src/lib/use-current-customer.ts` | 클라이언트 폼이 로그인 회원 정보를 가져오는 훅. 두 폼이 공유 |

**수정**

| 경로 | 변경 내용 |
|---|---|
| `frontend/src/lib/site.ts` | 연락처 상수 추가 |
| `frontend/src/components/site-footer.tsx` | 하드코딩 → 상수 참조 |
| `frontend/src/app/(site)/about/page.tsx` | 하드코딩 → 상수 참조 |
| `frontend/src/app/(site)/privacy/page.tsx` | 이메일만 상수 참조 (주소 문구는 법적 문서라 손대지 않음) |
| `frontend/src/app/(site)/contact/page.tsx` | 전화 블록 삭제, 이메일·시간 상수 참조 |
| `frontend/src/app/(site)/contact/contact-form.tsx` | 전화 안내 제거 · 자동 채움 · 회원 안내 배너 |
| `frontend/src/app/(site)/rentals/page.tsx` | 전화 블록·표 행 삭제, 이메일·주소 상수 참조 |
| `frontend/src/app/(site)/rentals/rental-form.tsx` | 전화 안내 제거 · 자동 채움 · 회원 안내 배너 |
| `frontend/src/app/(site)/support/page.tsx` | 갈린 번호 삭제 · 뉴스레터 FAQ 문구 수정 |
| `frontend/src/app/api/auth/me/route.ts` | 응답에 `email`·`phone`·`organization` 추가 |
| `frontend/src/app/api/contact/inquiries/route.ts` | `user_id` 서버 주입 |
| `frontend/src/app/api/rentals/inquiries/route.ts` | `user_id` 서버 주입 |
| `frontend/src/app/api/auth/signup/route.ts` | 뉴스레터 선택 동의 처리 |
| `frontend/src/app/(site)/signup/signup-form.tsx` | 뉴스레터 선택 동의 체크박스 |
| `frontend/src/app/(site)/mypage/page.tsx` | 내 문의 내역 섹션 |

**손대지 않는 것:** 어드민 문의 화면, 문의 상태 enum, 두 테이블의 RLS 정책, 폼 필드 구성·검증 규칙, rate limiter 설정.

---

## Task 1: 연락처 상수 도입

전화번호가 8개 파일에 흩어져 있어 `/support`만 다른 번호를 안내하는 사고가 났다. 먼저 단일 출처를 만든다. 이 태스크는 **화면에 보이는 문자열이 하나도 바뀌지 않는** 순수 리팩터다.

**Files:**
- Modify: `frontend/src/lib/site.ts`
- Modify: `frontend/src/components/site-footer.tsx:88-97`
- Modify: `frontend/src/app/(site)/about/page.tsx:24-33`
- Modify: `frontend/src/app/(site)/privacy/page.tsx:36`

- [ ] **Step 1: `lib/site.ts`에 상수 추가**

파일 끝에 이어 붙인다. 기존 `SITE_URL`은 그대로 둔다.

```ts
/**
 * 연락처 단일 출처. 예전엔 8개 파일에 하드코딩돼 있어 /support 만 다른 번호
 * (070-7606-7586) 를 안내하는 사고가 났다. 표기가 필요한 곳은 반드시 여기를 참조한다.
 */
export const CONTACT_EMAIL = "data-edu@kbrainc.com";
export const CONTACT_PHONE = "070-5066-0995";
export const OFFICE_HOURS = "평일 10:00 ~ 18:00";

/** 본사 */
export const OFFICE_ADDRESS = "서울시 동작구 보라매로5길 51 롯데타워 301~309호";
/** 공개교육장 · 대관 강의실 */
export const VENUE_ADDRESS = "서울시 마포구 성암로 189 중소기업DMC타워 701호";
```

- [ ] **Step 2: 푸터를 상수 참조로 전환**

`site-footer.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL, CONTACT_PHONE, OFFICE_ADDRESS } from "@/lib/site";
```

`88-97` 블록의 `<ul>` 내부를 교체:

```tsx
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-zinc-700">
              <li>{CONTACT_EMAIL}</li>
              <li>{CONTACT_PHONE}</li>
              <li className="text-zinc-500">{OFFICE_ADDRESS}</li>
            </ul>
```

- [ ] **Step 3: `/about`을 상수 참조로 전환**

`about/page.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL, CONTACT_PHONE, OFFICE_ADDRESS, VENUE_ADDRESS } from "@/lib/site";
```

`24-33`의 `company` 배열에서 해당 4개 항목의 `dd`를 교체:

```tsx
const company = [
  { dt: "법인명", dd: "케이브레인컴퍼니 (DAEASY 데이터교육 브랜드)" },
  { dt: "대표", dd: "민상일" },
  { dt: "대표번호", dd: CONTACT_PHONE },
  { dt: "이메일", dd: CONTACT_EMAIL },
  { dt: "본사", dd: OFFICE_ADDRESS },
  { dt: "공개교육장", dd: VENUE_ADDRESS },
  { dt: "사업자등록번호", dd: "129-86-50144" },
  { dt: "통신판매업신고", dd: "제2026-서울동작-0124호" },
];
```

- [ ] **Step 4: `/privacy`의 이메일만 상수 참조로 전환**

`privacy/page.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL } from "@/lib/site";
```

`36`행 교체:

```tsx
          <li>이메일: {CONTACT_EMAIL}</li>
```

**주소 줄(`서울특별시 동작구 …`)은 건드리지 않는다.** 개인정보처리방침은 법적 문서이고,
표기가 `서울특별시`로 상수(`서울시`)와 미묘하게 다르다. 문구 통일은 이번 작업의 범위가 아니다.

- [ ] **Step 5: lint + build**

```powershell
cd frontend; npm run lint; npm run build
```

기대: 둘 다 통과.

- [ ] **Step 6: 수동 확인 — 화면 문자열이 안 바뀌었는지**

`npm run dev` 후 `/`(푸터), `/about`, `/privacy`를 열어 연락처 표기가 **이전과 완전히 동일**한지 본다. 이 태스크에서 보이는 값이 바뀌면 상수를 잘못 넣은 것이다.

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/lib/site.ts frontend/src/components/site-footer.tsx "frontend/src/app/(site)/about/page.tsx" "frontend/src/app/(site)/privacy/page.tsx"
git commit -m "refactor(frontend): 연락처를 lib/site.ts 단일 출처로 상수화"
```

---

## Task 2: 문의 유도 지점에서 전화번호 제거

`/contact`·`/rentals`·`/support`에서 전화 안내를 걷어낸다. 푸터와 `/about`의 대표번호는 사업자 기본정보이므로 **남긴다**. `/support`의 `070-7606-7586`은 유효하지 않은 것으로 보고 폐기한다.

**Files:**
- Modify: `frontend/src/app/(site)/contact/page.tsx:51-80`
- Modify: `frontend/src/app/(site)/contact/contact-form.tsx:63-65,183-187`
- Modify: `frontend/src/app/(site)/rentals/page.tsx:297-320,353-365`
- Modify: `frontend/src/app/(site)/rentals/rental-form.tsx:63-65,167-171`
- Modify: `frontend/src/app/(site)/support/page.tsx:33-45,50-66`

- [ ] **Step 1: `/contact` 사이드 연락처 블록 교체**

`contact/page.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL, OFFICE_HOURS } from "@/lib/site";
```

`51-80` 구간(`<p className="mt-7 …">` 부터 `</div>` 까지)을 통째로 교체:

```tsx
              <p className="mt-7 text-[16px] leading-[1.85] text-zinc-700">
                조직 규모, 산업, 학습 목표를 공유해주시면 가장 잘 맞는 과정을 제안드립니다.
                아래 폼으로 보내주시면 담당자가 영업일 기준 1일 이내로 회신드립니다.
              </p>
              <div className="mt-8 space-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-baseline gap-3 text-[15px] text-zinc-800 hover:text-ink"
                >
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    메일
                  </span>
                  <span className="font-medium">{CONTACT_EMAIL}</span>
                </a>
                <div className="flex items-baseline gap-3 text-[15px] text-zinc-700">
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    시간
                  </span>
                  <span>{OFFICE_HOURS}</span>
                </div>
              </div>
```

- [ ] **Step 2: `contact-form.tsx`의 전화 안내 2곳 교체**

`contact-form.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL } from "@/lib/site";
```

`63-65` (접수 완료 문구):

```tsx
        <p className="mt-4 text-[15px] leading-[1.8] text-zinc-700">
          담당자가 영업일 기준 1일 이내로 회신드립니다.
        </p>
```

`183-187` (실패 문구):

```tsx
        {state === "error" && (
          <p className="text-[13px] leading-[1.6] text-red-600">
            전송에 실패했습니다. 잠시 후 다시 시도하시거나 {CONTACT_EMAIL} 로 보내주세요.
          </p>
        )}
```

- [ ] **Step 3: `/rentals` 사이드 연락처 블록 교체**

`rentals/page.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL, VENUE_ADDRESS } from "@/lib/site";
```

`297-320` 구간(`<p className="mt-7 …">` 부터 그 아래 `</div>` 까지)을 교체:

```tsx
              <p className="mt-7 text-[16px] leading-[1.85] text-zinc-700">
                폼을 제출하시면 담당자가 영업일 기준 1일 이내로 연락드립니다.
              </p>
              <div className="mt-8 space-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-baseline gap-3 text-[15px] text-zinc-800 hover:text-ink"
                >
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    메일
                  </span>
                  <span className="font-medium">{CONTACT_EMAIL}</span>
                </a>
              </div>
```

- [ ] **Step 4: `/rentals` "오시는 길" 표에서 대표번호 행 삭제**

`353-358`의 대표번호 `<div>` 블록 전체를 삭제한다. 남는 세 항목(주소·교통·메일)의 `dd` 중 주소와 메일을 상수 참조로 바꾼다:

```tsx
            <div>
              <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                주소
              </dt>
              <dd className="mt-2 text-[15px] leading-[1.7] text-zinc-800">
                {VENUE_ADDRESS}
              </dd>
            </div>
```

```tsx
            <div>
              <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                메일
              </dt>
              <dd className="mt-2 text-[15px] text-zinc-800">{CONTACT_EMAIL}</dd>
            </div>
```

주소를 상수로 바꾸면 기존 `<br />` 줄바꿈이 사라진다 — 의도된 것이다. `/about`과 같은 한 줄 표기로 통일된다.

- [ ] **Step 5: `rental-form.tsx`의 전화 안내 2곳 교체**

`rental-form.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL } from "@/lib/site";
```

`63-65`:

```tsx
        <p className="mt-4 text-[15px] leading-[1.8] text-zinc-700">
          담당자가 영업일 기준 1일 이내로 연락드립니다.
        </p>
```

`167-171`:

```tsx
        {state === "error" && (
          <p className="text-[13px] leading-[1.6] text-red-600">
            신청에 실패했습니다. 잠시 후 다시 시도하시거나 {CONTACT_EMAIL} 로 보내주세요.
          </p>
        )}
```

- [ ] **Step 6: `/support` FAQ의 갈린 번호 삭제**

`support/page.tsx` 상단 import에 추가:

```tsx
import { CONTACT_EMAIL } from "@/lib/site";
```

`33-45`의 `a` (교육상담 추천 FAQ):

```tsx
      <>
        <p>두 가지 방법으로 상담을 받을 수 있습니다.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            빠른 상담신청:{" "}
            <Link href="/contact" className="font-semibold underline-offset-4 hover:underline">
              교육 문의 페이지
            </Link>
          </li>
          <li>이메일 {CONTACT_EMAIL}</li>
        </ul>
      </>
```

`50-66`의 `a` (기업·기관 교육 FAQ):

```tsx
      <>
        <p>
          기업·기관에서 직접 교육하는 과정의 경우, 상시 상담을 통해 커리큘럼을 구성해 드립니다. 아래 문의처로 연락 주시면 빠르게 안내해 드립니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            빠른 상담신청:{" "}
            <Link href="/contact" className="font-semibold underline-offset-4 hover:underline">
              교육 문의 페이지
            </Link>
          </li>
          <li>이메일 {CONTACT_EMAIL}</li>
        </ul>
      </>
```

- [ ] **Step 7: 전화번호가 남았는지 검사**

```bash
cd frontend && grep -rn "070-" src/
```

기대 출력: **`src/lib/site.ts` 한 줄만**. `tel:` 링크도 확인:

```bash
cd frontend && grep -rn "tel:" src/
```

기대 출력: `src/app/admin/(authed)/inquiries/rentals/inquiries-table.tsx` 한 줄만 (어드민이 **고객** 번호로 거는 링크라 남는 게 맞다).

- [ ] **Step 8: lint + build**

```powershell
cd frontend; npm run lint; npm run build
```

기대: 둘 다 통과.

- [ ] **Step 9: 수동 확인**

`npm run dev` 후 `/contact`, `/rentals`, `/support`를 열어 페이지 어디에도 전화번호가 없는지 확인한다. `/rentals`의 "오시는 길"에 주소·교통·메일 세 항목만 남았는지도 본다.

- [ ] **Step 10: 커밋**

```bash
git add "frontend/src/app/(site)/contact" "frontend/src/app/(site)/rentals" "frontend/src/app/(site)/support/page.tsx"
git commit -m "feat(frontend): 문의 유도 지점에서 전화 안내 제거 — 웹 문의·이메일로 일원화"
```

---

## Task 3: 마이그레이션 — 문의-회원 연결 컬럼

**Files:**
- Create: `supabase/migrations/20260821120000_inquiry_user_linkage.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 문의를 회원 계정에 연결한다. 로그인 회원은 마이페이지에서 자기 문의 상태를 본다.
-- on delete set null: 회원이 탈퇴해도 어드민의 문의 기록 자체는 남아야 한다.

alter table public.contact_inquiries
  add column user_id uuid references auth.users(id) on delete set null;

create index contact_inquiries_user_idx
  on public.contact_inquiries (user_id, created_at desc);

alter table public.rental_inquiries
  add column user_id uuid references auth.users(id) on delete set null;

create index rental_inquiries_user_idx
  on public.rental_inquiries (user_id, created_at desc);

-- 광고성 정보 수신 동의 시점. 정보통신망법상 개인정보 수집·이용 동의와 별개이며
-- 동의 시점 증빙이 필요하다.
alter table public.customer_profiles
  add column marketing_agreed_at timestamptz;

-- RLS 정책은 변경하지 않는다. 두 문의 테이블은 계속 anon insert 만 허용하고,
-- 읽기는 전부 service_role 경유다 (어드민 페이지도, 마이페이지도 server component).
-- user_id 가 생겼다고 브라우저가 문의를 직접 select 하게 열어주지 않는다.
```

- [ ] **Step 2: Supabase Cloud에 적용**

Supabase 대시보드 → SQL Editor에 위 SQL을 붙여 실행한다. (이 프로젝트는 로컬 Supabase 스택을 쓰지 않는다.)

- [ ] **Step 3: 적용 확인**

SQL Editor에서 실행:

```sql
select table_name, column_name, data_type
from information_schema.columns
where (table_name = 'contact_inquiries' and column_name = 'user_id')
   or (table_name = 'rental_inquiries' and column_name = 'user_id')
   or (table_name = 'customer_profiles' and column_name = 'marketing_agreed_at');
```

기대: 3행이 나온다.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/20260821120000_inquiry_user_linkage.sql
git commit -m "feat(db): 문의 테이블에 user_id, customer_profiles 에 marketing_agreed_at 추가"
```

---

## Task 4: 문의 API가 `user_id`를 서버에서 주입

**클라이언트가 보낸 `user_id`는 받지도 믿지도 않는다.** `Payload` 타입에 `user_id`를 추가하지 말 것 — 요청 본문으로 남의 `user_id`를 넣어 타인의 마이페이지에 문의를 심는 경로를 원천 차단하기 위함이다.

**Files:**
- Modify: `frontend/src/app/api/contact/inquiries/route.ts`
- Modify: `frontend/src/app/api/rentals/inquiries/route.ts`

- [ ] **Step 1: 교육 문의 API에 주입**

`app/api/contact/inquiries/route.ts` 상단 import에 추가:

```ts
import { getCurrentCustomer } from "@/lib/customer-auth";
```

`const sb = getSupabaseAdmin();` 바로 아래에 추가:

```ts
  // 로그인 회원이면 문의를 계정에 연결한다. 세션이 없거나 조회에 실패하면
  // null 이 되어 비회원 문의로 접수된다 — 문의 접수 자체를 막지 않는다.
  const customer = await getCurrentCustomer().catch(() => null);
```

`insert({ ... })` 객체에 `user_id`를 추가:

```ts
    .insert({
      name,
      email,
      phone,
      company,
      course_id: courseId,
      message,
      user_id: customer?.id ?? null,
    })
```

- [ ] **Step 2: 대관 문의 API에 주입**

`app/api/rentals/inquiries/route.ts` 상단 import에 추가:

```ts
import { getCurrentCustomer } from "@/lib/customer-auth";
```

`const usageDate = ...` 블록 아래, insert 직전에 추가:

```ts
  // 로그인 회원이면 신청을 계정에 연결한다. 실패해도 비회원 신청으로 접수된다.
  const customer = await getCurrentCustomer().catch(() => null);
```

`insert({ ... })` 객체에 추가:

```ts
    .insert({
      name,
      phone,
      usage_date: usageDate,
      time_slot: timeSlot,
      message,
      user_id: customer?.id ?? null,
    })
```

- [ ] **Step 3: lint + build**

```powershell
cd frontend; npm run lint; npm run build
```

기대: 둘 다 통과.

- [ ] **Step 4: 수동 확인 — 비회원 경로가 안 깨졌는지 (가장 중요)**

`npm run dev` 후 **로그아웃 상태**(시크릿 창)에서:

1. `/contact` 폼을 채워 제출 → "문의가 접수되었습니다" 표시
2. `/rentals` 폼을 채워 제출 → "신청이 접수되었습니다" 표시
3. Supabase SQL Editor에서 확인:

```sql
select id, name, user_id, created_at from public.contact_inquiries order by created_at desc limit 1;
select id, name, user_id, created_at from public.rental_inquiries order by created_at desc limit 1;
```

기대: 방금 넣은 행이 있고 `user_id`가 `null`.

- [ ] **Step 5: 수동 확인 — 회원 경로**

같은 브라우저에서 `/login`으로 회원 로그인 후 위 1~2를 반복하고 SQL을 다시 실행한다.
기대: `user_id`가 해당 회원의 `auth.users.id`로 채워져 있다.

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/app/api/contact/inquiries/route.ts frontend/src/app/api/rentals/inquiries/route.ts
git commit -m "feat(api): 로그인 세션에서 문의의 user_id 를 서버가 주입"
```

---

## Task 5: 폼 자동 채움 + 회원 안내 배너

`/rentals`는 `revalidate = 60` ISR이다(어드민 예약 현황을 재배포 없이 반영). page에서 쿠키를 읽으면 그 캐시가 통째로 깨진다. 따라서 **두 폼 모두 클라이언트에서** 회원 정보를 가져온다 — `components/customer-nav.tsx`가 이미 쓰는 패턴이다.

**Files:**
- Modify: `frontend/src/app/api/auth/me/route.ts`
- Create: `frontend/src/lib/use-current-customer.ts`
- Modify: `frontend/src/app/(site)/contact/contact-form.tsx`
- Modify: `frontend/src/app/(site)/rentals/rental-form.tsx`

- [ ] **Step 1: `/api/auth/me` 응답 확장**

`app/api/auth/me/route.ts` 전체를 교체:

```ts
import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/customer-auth";

export async function GET() {
  const customer = await getCurrentCustomer();
  return NextResponse.json(
    customer
      ? {
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            organization: customer.organization,
          },
        }
      : { customer: null },
  );
}
```

본인 세션으로만 조회되는 자기 정보이므로 노출 범위는 늘지 않는다.
`components/customer-nav.tsx`는 `name`만 읽으므로 수정하지 않아도 계속 동작한다.

- [ ] **Step 2: 공유 훅 생성**

`frontend/src/lib/use-current-customer.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

export type CurrentCustomer = {
  name: string;
  email: string;
  phone: string;
  organization: string;
};

/**
 * 문의 폼을 미리 채우기 위해 로그인 회원 정보를 가져온다.
 *
 * page(server component)에서 읽지 않는 이유: /rentals 가 revalidate=60 ISR 이라
 * 서버에서 쿠키를 읽는 순간 예약 현황 캐시가 통째로 깨진다.
 */
export function useCurrentCustomer() {
  const [customer, setCustomer] = useState<CurrentCustomer | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json() as Promise<{ customer: CurrentCustomer | null }>)
      .then((body) => {
        if (active) setCustomer(body.customer);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return customer;
}
```

- [ ] **Step 3: `contact-form.tsx`에 자동 채움 적용**

상단 import에 추가:

```tsx
import { useCurrentCustomer } from "@/lib/use-current-customer";
```

`const [state, setState] = useState<FormState>("idle");` 아래에 추가:

```tsx
  const customer = useCurrentCustomer();
```

`<form onSubmit={handleSubmit} …>` 에 `key`를 추가한다. 입력이 uncontrolled(`form.reset()` 사용)이므로,
회원 정보가 도착하면 React가 폼을 remount 해야 `defaultValue`가 반영된다.

**알려진 트레이드오프:** remount 시점에 사용자가 이미 입력한 값은 지워진다. `/api/auth/me`는
mount 직후 호출되므로 실제로는 수백 ms 안에 끝나지만, 아주 빠르게 타이핑을 시작하면
한 글자 정도가 날아갈 수 있다. 입력을 controlled로 바꾸면 없앨 수 있으나 두 폼의 diff가
크게 늘어나므로 채택하지 않았다. Step 6 수동 확인에서 체감되는 수준인지 반드시 본다 —
체감된다면 controlled 전환을 별도 작업으로 올린다.

```tsx
    <form
      key={customer?.email ?? "anon"}
      onSubmit={handleSubmit}
      className="lg:col-span-7 rounded-3xl bg-zinc-50/70 p-8 ring-1 ring-zinc-100 sm:p-10"
    >
```

`<fieldset disabled={submitting} className="space-y-6">` 바로 다음 줄에 안내 배너를 넣는다.
**이 문구가 전화번호를 대신하는 유일한 설득 장치**이므로 눈에 띄어야 한다:

```tsx
        {customer && (
          <p className="rounded-md bg-ink/5 px-4 py-3 text-[13px] leading-[1.7] text-zinc-700">
            <strong className="font-bold text-ink">{customer.name}님</strong>으로 문의합니다.
            접수 후{" "}
            <Link href="/mypage" className="font-bold text-ink underline underline-offset-2">
              마이페이지
            </Link>
            에서 진행 상황을 확인할 수 있습니다.
          </p>
        )}
```

비회원에게는 이 자리에 **아무것도 띄우지 않는다** — 로그인을 유도하면 문의를 막는 인상을 준다.

네 입력에 `defaultValue`를 추가한다 (`required`·`name`·`type`·`placeholder`·`className`은 그대로):

| 입력 | 추가할 속성 |
|---|---|
| `name="name"` (92행) | `defaultValue={customer?.name ?? ""}` |
| `name="email"` (104행) | `defaultValue={customer?.email ?? ""}` |
| `name="phone"` (118행) | `defaultValue={customer?.phone ?? ""}` |
| `name="company"` (127행) | `defaultValue={customer?.organization ?? ""}` |

값은 수정 가능하게 둔다 — 실제 담당자가 가입자와 다를 수 있다.

- [ ] **Step 4: `rental-form.tsx`에 자동 채움 적용**

대관 폼에는 이메일·소속 필드가 없다. **이름·연락처만** 채운다.

상단 import에 추가:

```tsx
import { useCurrentCustomer } from "@/lib/use-current-customer";
```

`const [state, setState] = useState<FormState>("idle");` 아래에 추가:

```tsx
  const customer = useCurrentCustomer();
```

`<form onSubmit={handleSubmit} …>` 에 `key` 추가:

```tsx
    <form
      key={customer?.email ?? "anon"}
      onSubmit={handleSubmit}
      className="lg:col-span-7 rounded-3xl bg-zinc-50/70 p-8 ring-1 ring-zinc-100 sm:p-10"
    >
```

`<fieldset disabled={submitting} className="space-y-6">` 다음 줄에 배너:

```tsx
        {customer && (
          <p className="rounded-md bg-ink/5 px-4 py-3 text-[13px] leading-[1.7] text-zinc-700">
            <strong className="font-bold text-ink">{customer.name}님</strong>으로 신청합니다.
            접수 후{" "}
            <Link href="/mypage" className="font-bold text-ink underline underline-offset-2">
              마이페이지
            </Link>
            에서 진행 상황을 확인할 수 있습니다.
          </p>
        )}
```

`Link`는 이 파일에 이미 import 돼 있다(5행).

두 입력에 `defaultValue` 추가:

| 입력 | 추가할 속성 |
|---|---|
| `name="name"` (92행) | `defaultValue={customer?.name ?? ""}` |
| `name="phone"` (104행) | `defaultValue={customer?.phone ?? ""}` |

- [ ] **Step 5: lint + build**

```powershell
cd frontend; npm run lint; npm run build
```

기대: 둘 다 통과.

- [ ] **Step 6: 수동 확인 — 자동 채움**

`npm run dev` 후 회원으로 로그인한 상태에서:

1. `/contact` → 이름·이메일·연락처·조직이 채워져 있고, 상단에 "○○님으로 문의합니다" 배너가 보인다
2. `/rentals` → 이름·연락처가 채워져 있고 배너가 보인다
3. 값을 임의로 고쳐 제출 → **고친 값**이 저장되는지 SQL로 확인

- [ ] **Step 7: 수동 확인 — 비회원 & ISR**

시크릿 창(로그아웃)에서:

1. `/contact`·`/rentals` 입력이 모두 비어 있고 배너가 **없는지** 확인
2. `/rentals`가 여전히 ISR인지 확인 — build 출력에서 `/rentals`가 `Static`/`ISR`로 표시되고 `Dynamic`이 아니어야 한다:

```powershell
cd frontend; npm run build
```

`/rentals`가 `ƒ (Dynamic)`으로 바뀌었다면 어딘가에서 서버가 쿠키를 읽고 있는 것이다 — 되돌린다.

- [ ] **Step 8: 커밋**

```bash
git add frontend/src/lib/use-current-customer.ts frontend/src/app/api/auth/me/route.ts "frontend/src/app/(site)/contact/contact-form.tsx" "frontend/src/app/(site)/rentals/rental-form.tsx"
git commit -m "feat(frontend): 로그인 회원 문의 폼 자동 채움 + 마이페이지 안내 배너"
```

---

## Task 6: 마이페이지 내 문의 내역

**Files:**
- Modify: `frontend/src/app/(site)/mypage/page.tsx`

- [ ] **Step 1: `mypage/page.tsx` 전체 교체**

이미 `dynamic = "force-dynamic"` server component다. 조회는 `getSupabaseAdmin()`(service_role)으로 한다 — 고객 데이터는 브라우저가 직접 select 하지 않는다는 기존 원칙(`supabase/migrations/20260806120000_customer_profiles.sql` 주석)을 따른다.

펼쳐보기는 네이티브 `<details>`로 처리해 client component를 새로 만들지 않는다.

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { STATUS_LABEL, type InquiryStatus } from "@/lib/admin-inquiries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata = { title: "내 정보" };
export const dynamic = "force-dynamic";

/** 최근 N건만 보여준다. 개인 문의가 그 이상 쌓일 시나리오가 아직 없어 페이지네이션은 두지 않는다. */
const LIMIT = 20;

type MyInquiry = {
  id: string;
  kind: "contact" | "rental";
  createdAt: string;
  status: InquiryStatus;
  /** 과정명(교육) 또는 희망 일시(대관) */
  detail: string | null;
  message: string;
};

type ContactRow = {
  id: string;
  created_at: string;
  status: InquiryStatus;
  message: string;
  course: { title: string } | null;
};

type RentalRow = {
  id: string;
  created_at: string;
  status: InquiryStatus;
  message: string;
  usage_date: string | null;
  time_slot: string | null;
};

/**
 * 두 문의 테이블을 user_id 로 조회해 시간순으로 합친다.
 * 조회에 실패하면 null 을 돌려준다 — 내 정보까지 같이 죽이지 않기 위함이다.
 */
async function fetchMyInquiries(userId: string): Promise<MyInquiry[] | null> {
  const sb = getSupabaseAdmin();

  const [contact, rental] = await Promise.all([
    sb
      .from("contact_inquiries")
      .select("id, created_at, status, message, course:courses(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    sb
      .from("rental_inquiries")
      .select("id, created_at, status, message, usage_date, time_slot")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  if (contact.error || rental.error) {
    console.error(
      "문의 내역 조회 실패:",
      contact.error?.message ?? rental.error?.message,
    );
    return null;
  }

  const rows: MyInquiry[] = [
    ...((contact.data ?? []) as unknown as ContactRow[]).map((r) => ({
      id: r.id,
      kind: "contact" as const,
      createdAt: r.created_at,
      status: r.status,
      detail: r.course?.title ?? null,
      message: r.message,
    })),
    ...((rental.data ?? []) as unknown as RentalRow[]).map((r) => ({
      id: r.id,
      kind: "rental" as const,
      createdAt: r.created_at,
      status: r.status,
      detail: [r.usage_date, r.time_slot].filter(Boolean).join(" · ") || null,
      message: r.message,
    })),
  ];

  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LIMIT);
}

const STATUS_CLASS: Record<InquiryStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  closed: "bg-zinc-100 text-zinc-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MyPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  const inquiries = await fetchMyInquiries(customer.id);

  const rows = [
    ["이름", customer.name],
    ["이메일", customer.email],
    ["연락처", customer.phone],
    ["소속", customer.organization],
  ];

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">마이페이지</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">내 정보</h1>
      <dl className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[100px_1fr] gap-4 py-5 text-sm">
            <dt className="font-bold text-zinc-600">{label}</dt>
            <dd className="text-zinc-900">{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-16 text-2xl font-semibold tracking-tight">문의 내역</h2>

      {inquiries === null ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          문의 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      ) : inquiries.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500">
          아직 문의 내역이 없습니다.{" "}
          <Link href="/contact" className="font-bold text-ink underline underline-offset-2">
            교육 문의하기
          </Link>
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200">
          {inquiries.map((row) => (
            <li key={`${row.kind}-${row.id}`} className="py-5">
              <details>
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                    <span className="font-bold text-zinc-900">
                      {row.kind === "contact" ? "교육 문의" : "대관 문의"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                    <span className="text-zinc-500">{formatDate(row.createdAt)}</span>
                  </div>
                  {row.detail && (
                    <p className="mt-1.5 text-[13px] text-zinc-600">{row.detail}</p>
                  )}
                </summary>
                <p className="mt-3 whitespace-pre-wrap rounded-md bg-zinc-50 px-4 py-3 text-[13px] leading-[1.8] text-zinc-700">
                  {row.message || "작성한 내용이 없습니다."}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

상태 라벨은 `lib/admin-inquiries.ts`의 `STATUS_LABEL`(신규 / 응대 중 / 완료)을 그대로 쓴다.
어드민과 고객이 다른 단어를 보면 통화할 때 말이 어긋난다.

- [ ] **Step 2: lint + build**

```powershell
cd frontend; npm run lint; npm run build
```

기대: 둘 다 통과.

- [ ] **Step 3: 수동 확인 — 내역 없음**

문의 이력이 없는 회원으로 로그인해 `/mypage`를 연다.
기대: "아직 문의 내역이 없습니다" + `/contact` 링크.

- [ ] **Step 4: 수동 확인 — 내역 있음**

Task 5에서 회원으로 넣은 교육·대관 문의 2건이 `/mypage`에 뜨는지 본다.
기대: 두 건이 최신순으로 보이고, 유형·상태 뱃지("신규")·접수일이 표시되고, 클릭하면 문의 본문이 펼쳐진다.

- [ ] **Step 5: 수동 확인 — 상태 반영**

어드민(`/admin/inquiries/contact`)에서 그 문의의 상태를 "응대 중"으로 바꾼 뒤 `/mypage`를 새로고침한다.
기대: 뱃지가 "응대 중"으로 바뀐다.

- [ ] **Step 6: 수동 확인 — 남의 문의가 안 보이는지**

Task 4 Step 4에서 넣은 **비회원 문의**(`user_id = null`)가 마이페이지에 보이지 않아야 한다.
회원 계정이 둘 있다면 A로 넣은 문의가 B의 마이페이지에 없는지도 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add "frontend/src/app/(site)/mypage/page.tsx"
git commit -m "feat(frontend): 마이페이지에 내 문의 내역·처리 상태 표시"
```

---

## Task 7: 회원가입 뉴스레터 선택 동의

고객센터 FAQ가 "가입자는 교육 개설이 확정되면 뉴스레터를 받게 되며"라고 안내하지만 실제로는 아무 등록도 일어나지 않는다. 선택 동의를 붙여 약속과 구현을 맞춘다.

**Files:**
- Modify: `frontend/src/app/(site)/signup/signup-form.tsx`
- Modify: `frontend/src/app/api/auth/signup/route.ts`
- Modify: `frontend/src/app/(site)/support/page.tsx:70-79`

- [ ] **Step 1: 가입 폼에 선택 체크박스 추가**

`signup-form.tsx`의 `payload` 객체에 필드 추가 (`privacyAgreed` 다음 줄):

```tsx
      marketingAgreed: form.get("marketingAgreed") === "on",
```

개인정보 동의 `<label>` 블록(75-80행) 바로 아래에 추가:

```tsx
      <label className="flex items-start gap-3 rounded-md border border-zinc-200 p-4 text-sm leading-6 text-zinc-700">
        <input name="marketingAgreed" type="checkbox" disabled={submitting} className="mt-1 h-4 w-4 accent-black" />
        <span>
          교육 개설 소식과 뉴스레터를 이메일로 받겠습니다. <span className="text-zinc-500">(선택)</span>
        </span>
      </label>
```

`required`를 **넣지 않는다** — 선택 항목이다.

- [ ] **Step 2: 가입 API에서 처리**

`app/api/auth/signup/route.ts` 상단 import에 추가:

```ts
import { getSupabaseAdmin } from "@/lib/supabase";
```

`Payload` 타입에 필드 추가:

```ts
  marketingAgreed?: boolean;
```

`if (error) { ... }` 블록 아래, `return NextResponse.json({ ok: true, ... })` 직전에 추가:

```ts
  // 광고성 정보 수신은 개인정보 수집·이용 동의와 별개다. 체크한 사람만 등록한다.
  //
  // 여기서 실패해도 가입은 성공으로 응답한다. auth.signUp() 이 이미 통과했으므로
  // 계정은 만들어진 상태이고, 4xx/5xx 를 돌려주면 사용자가 재시도해 중복 가입
  // 오류를 만난다. 실패는 함수 로그에만 남긴다.
  if (payload.marketingAgreed === true && data.user) {
    const admin = getSupabaseAdmin();

    const { error: newsletterError } = await admin
      .from("newsletter_subscribers")
      .upsert(
        { email, status: "active", unsubscribed_at: null, source: "signup" },
        { onConflict: "email" },
      );
    if (newsletterError) {
      console.error("가입 시 뉴스레터 등록 실패:", newsletterError.message);
    }

    const { error: consentError } = await admin
      .from("customer_profiles")
      .update({ marketing_agreed_at: new Date().toISOString() })
      .eq("id", data.user.id);
    if (consentError) {
      console.error("마케팅 동의 시점 기록 실패:", consentError.message);
    }
  }
```

`customer_profiles` 행은 `auth.users` insert 트리거(`create_customer_profile()`)가 같은 트랜잭션에서 만들므로, `signUp()` 반환 시점엔 이미 존재한다.

- [ ] **Step 3: `/support` FAQ 문구를 실제 동작에 맞게 수정**

`support/page.tsx`의 "교육 신청은 어떻게 진행되나요?" 항목(70-79행)에서 첫 `<p>`를 교체:

```tsx
        <p>
          가입 시 뉴스레터 수신에 동의하시면 교육 개설이 확정될 때 안내 메일을 받게 되며, 해당 메일의 스케줄에 맞춰 공개과정 신청 페이지에서 교육 신청을 진행하면 됩니다.
        </p>
```

- [ ] **Step 4: lint + build**

```powershell
cd frontend; npm run lint; npm run build
```

기대: 둘 다 통과.

- [ ] **Step 5: 수동 확인 — 미체크 가입**

시크릿 창에서 새 이메일로 가입하되 뉴스레터 체크박스를 **비운다**. SQL Editor:

```sql
select email from public.newsletter_subscribers where email = '<방금 가입한 이메일>';
select email, marketing_agreed_at from public.customer_profiles where email = '<방금 가입한 이메일>';
```

기대: 첫 쿼리 0행. 둘째 쿼리에서 `marketing_agreed_at`이 `null`.

- [ ] **Step 6: 수동 확인 — 체크 가입**

또 다른 새 이메일로 가입하며 체크박스를 **켠다**. 같은 SQL 실행.

기대: `newsletter_subscribers`에 `status = 'active'`, `source = 'signup'` 행이 있고,
`customer_profiles.marketing_agreed_at`에 시각이 기록돼 있다.

- [ ] **Step 7: 커밋**

```bash
git add "frontend/src/app/(site)/signup/signup-form.tsx" frontend/src/app/api/auth/signup/route.ts "frontend/src/app/(site)/support/page.tsx"
git commit -m "feat(frontend): 회원가입 뉴스레터 선택 동의 — FAQ 약속과 구현 일치"
```

---

## 최종 확인

모든 태스크 완료 후 한 번에 점검한다.

- [ ] **전화번호 잔존 검사**

```bash
cd frontend && grep -rn "070-" src/
```

기대: `src/lib/site.ts` 한 줄만.

- [ ] **빌드 + 렌더링 모드**

```powershell
cd frontend; npm run lint; npm run build
```

기대: 통과. 그리고 build 출력에서 `/rentals`가 여전히 ISR(`Static`/revalidate 표기)이고 `Dynamic`이 아니어야 한다.

- [ ] **비회원 문의 경로 회귀 확인**

시크릿 창에서 `/contact`·`/rentals` 제출이 정상 접수되고, 어드민(`/admin/inquiries/contact`, `/admin/inquiries/rentals`) 목록에 뜨는지 확인한다.

- [ ] **`main` 브랜치 push**

lint·build가 모두 통과했다면 push한다 (전역 규칙: 통과 시 별도 확인 없이 push 가능).

```bash
git push origin main
```

---

## 후속 작업 (이번 범위 밖)

- `070-7606-7586`이 실제 사용 중인 번호인지 확인. 사용 중이라면 폐기가 아니라 통일 결정이 필요하다.
- 어드민 답변 작성 → 마이페이지 노출 (문의 스레드화)
- 뉴스레터 실제 발송 경로 (`newsletter_issues` 테이블만 존재, 발송 미구현)
- AI 챔피언 소개 페이지 개선 — 별도 스펙으로 진행
