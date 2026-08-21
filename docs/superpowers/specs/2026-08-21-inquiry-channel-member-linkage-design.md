# 문의 채널 회원 연동 설계

- 작성일: 2026-08-21
- 범위: 교육 문의(`/contact`) · 대관 문의(`/rentals`) · 회원가입(`/signup`) · 마이페이지(`/mypage`) · 고객센터(`/support`)
- 제외: AI 챔피언 소개 페이지 개선 (별도 스펙에서 다룬다)

## 배경

현재 사이트의 문의 경로에는 세 가지 문제가 있다.

1. **전화번호가 갈려 있다.** `/contact`·`/rentals`·푸터·`/about`은 `070-5066-0995`를,
   `/support` FAQ 2곳은 `070-7606-7586`을 안내한다. 어느 쪽이 유효한지 방문자가 알 수 없다.
   연락처가 8개 파일에 하드코딩돼 있어 한 번 더 바뀌면 같은 문제가 재발한다.
2. **문의가 회원과 연결되지 않는다.** `contact_inquiries`·`rental_inquiries` 어디에도
   `user_id`가 없다. 가입해도 자기 문의가 어떻게 처리되는지 볼 방법이 없다.
3. **회원가입의 가치가 비어 있다.** 가입 후 얻는 것은 `/mypage`의 내 정보 4줄 표시가 전부다.
   고객센터 FAQ는 "가입자는 교육 개설이 확정되면 뉴스레터를 받게 되며"라고 안내하지만
   `api/auth/signup/route.ts`는 `newsletter_subscribers`에 아무것도 넣지 않는다. 약속이 지켜지지 않고 있다.

## 목표

전화 안내를 걷어내고 웹 문의로 유입을 모으되, **비회원 문의 경로는 지금과 100% 동일하게 유지한다.**
회원에게는 "내 문의가 어떻게 처리되고 있는지 볼 수 있다"는 구체적 이유를 준다.

### 성공 조건

- 비회원이 지금과 똑같은 단계로 교육·대관 문의를 접수할 수 있다.
- 로그인 회원이 문의하면 이름·연락처·소속이 자동으로 채워지고, 접수 후 마이페이지에서 상태를 확인할 수 있다.
- 문의 유도 지점(`/contact`·`/rentals`·`/support`) 어디에도 전화번호가 남아 있지 않다.
- 사이트 전체에서 전화번호·이메일·주소가 `lib/site.ts` 한 곳에서 나온다.
- 뉴스레터는 가입 시 선택 동의를 체크한 사람만 받는다.
- `npm run lint && npm run build` 통과.

## 채택한 방향과 대안

**채택: 기존 폼·어드민 구조를 유지한 채 회원 연결만 붙인다.**
테이블에 `user_id`를 추가하고, 로그인 상태면 서버가 주입하고, 마이페이지에 조회 섹션을 더한다.

검토했으나 채택하지 않은 대안:

- **문의를 `/contact` 하나로 통합하고 대관을 흡수** — 대관은 희망 일자·시간대 등 필드가 다르고
  어드민도 별도 테이블·화면이다. 통합하면 폼이 조건부 분기 덩어리가 된다.
  지금 문제를 푸는 데 필요하지 않은 변경이다.
- **문의를 로그인 필수로 전환** — 유입 손실이 크다. B2G 담당자가 가입 단계에서 이탈하면
  전화번호를 뺀 만큼 문의가 순감한다.

## 설계

### 1. 데이터 — 마이그레이션 1개

`supabase/migrations/20260821120000_inquiry_user_linkage.sql`

```sql
alter table public.contact_inquiries
  add column user_id uuid references auth.users(id) on delete set null;
create index contact_inquiries_user_idx
  on public.contact_inquiries (user_id, created_at desc);

alter table public.rental_inquiries
  add column user_id uuid references auth.users(id) on delete set null;
create index rental_inquiries_user_idx
  on public.rental_inquiries (user_id, created_at desc);

alter table public.customer_profiles
  add column marketing_agreed_at timestamptz;
```

`on delete set null`인 이유: 회원이 탈퇴해도 어드민의 문의 기록은 남아야 한다.

`marketing_agreed_at`은 광고성 정보 수신 동의 시점을 남기기 위한 것이다.
정보통신망법상 광고성 정보 수신 동의는 개인정보 수집·이용 동의와 별개이며 동의 시점 증빙이 필요하다.

**RLS는 변경하지 않는다.** 두 문의 테이블은 지금처럼 anon `insert`만 허용한다.
읽기는 전부 service_role 경유다 — 어드민 페이지도, 마이페이지도 server component에서 조회한다.
`user_id`가 붙었다고 해서 브라우저가 문의를 직접 select 하게 열어주지 않는다.

### 2. 문의 제출 — `user_id`는 서버가 주입한다

`app/api/contact/inquiries/route.ts`, `app/api/rentals/inquiries/route.ts`

각 핸들러가 `getCurrentCustomer()`를 호출해 세션에서 회원을 확인하고, 있으면 그 `id`를
insert payload의 `user_id`로 넣는다. 비회원이면 `null`이며 나머지 동작은 지금과 완전히 같다.

**클라이언트가 보낸 `user_id`는 받지도 믿지도 않는다.** `Payload` 타입에 `user_id`를 추가하지 않는다.
요청 본문으로 남의 `user_id`를 넣어 타인의 마이페이지에 문의를 심는 경로를 원천 차단하기 위함이다.

`getCurrentCustomer()`가 실패해도(세션 만료 등) 문의 접수는 성공해야 한다 — 비회원 문의로 처리된다.

### 3. 문의 폼 — 클라이언트에서 자동 채움

`/rentals`는 `revalidate = 60` ISR이다(어드민이 등록한 예약 현황을 재배포 없이 반영하기 위함).
page(server component)에서 세션을 읽으면 쿠키 접근으로 ISR이 깨진다.
따라서 **두 폼 모두 클라이언트에서 `/api/auth/me`를 호출해 채운다.** `customer-nav.tsx`가 이미 쓰는 패턴이며,
한 가지 방식으로 통일된다.

`app/api/auth/me/route.ts`의 응답을 확장한다:

```
{ customer: { name } }  →  { customer: { name, email, phone, organization } }
```

본인 세션으로만 조회되는 자기 정보이므로 노출 범위 증가는 없다. `customer-nav.tsx`는 `name`만 읽으므로 수정 불필요.

- `contact-form.tsx`: `name` / `email` / `phone` / `company`(← `organization`) 채움
- `rental-form.tsx`: `name` / `phone` 채움 (대관 폼에는 이메일·소속 필드가 없다)

두 폼의 입력은 현재 uncontrolled(`defaultValue` 없이 `form.reset()` 사용)다.
이를 controlled로 바꾸면 diff가 커지므로, **`<form>`에 `key={customer?.id ?? "anon"}`를 주고
입력에 `defaultValue`를 넣어** 회원 정보 도착 시 React가 폼을 remount하게 한다.
`form.reset()`도 `defaultValue`로 되돌아가므로 "새 문의 작성" 흐름이 그대로 유지된다.

값은 수정 가능하게 둔다 — 실제 담당자가 가입자와 다를 수 있다.

로그인 상태면 폼 상단에 안내를 띄운다:

> ○○님으로 문의합니다 · 접수 후 마이페이지에서 진행 상황을 확인할 수 있습니다

이 문구가 전화번호를 대신하는 **유일한 설득 장치**이므로 눈에 띄어야 한다.
비회원에게는 이 자리에 로그인 유도를 보여주지 않는다 — 문의를 막는 인상을 주면 안 된다.

### 4. 전화번호 제거와 연락처 상수화

`lib/site.ts`에 상수를 모은다. 지금 이 파일에는 `SITE_URL` 하나뿐이다.

```ts
export const CONTACT_EMAIL = "data-edu@kbrainc.com";
export const CONTACT_PHONE = "070-5066-0995";
export const OFFICE_HOURS = "평일 10:00 ~ 18:00";
export const OFFICE_ADDRESS = "서울시 동작구 보라매로5길 51 롯데타워 301~309호";
```

`070-7606-7586`은 유효하지 않은 것으로 보고 폐기한다.

| 파일 | 처리 |
|---|---|
| `(site)/contact/page.tsx:56-64` | 전화 링크 블록 삭제. 이메일·시간은 상수 참조로 유지 |
| `(site)/contact/contact-form.tsx:64` | "급하신 경우 070-… 로 연락해주세요" 삭제 |
| `(site)/contact/contact-form.tsx:185` | 실패 문구를 이메일 안내로 교체 |
| `(site)/rentals/page.tsx:303-311` | 전화 링크 삭제. 이메일은 상수 참조로 유지 |
| `(site)/rentals/page.tsx:355-358` | 표의 전화 행 삭제 |
| `(site)/rentals/rental-form.tsx:64,169` | contact-form과 동일 처리 |
| `(site)/support/page.tsx:41,62` | `070-7606-7586` 줄 삭제. 문의 페이지 링크 + 이메일만 |
| `components/site-footer.tsx:93-95` | **번호 유지**, 상수 참조로 전환 |
| `(site)/about/page.tsx:27-29` | **번호 유지**, 상수 참조로 전환 (대표번호·이메일·본사 주소) |
| `(site)/privacy/page.tsx:36` | 이메일을 상수 참조로 전환 |

푸터와 `/about`의 대표번호를 남기는 이유: 사업자 기본정보이고,
연락처가 아예 없는 B2G 사이트는 신뢰를 잃는다. 다만 **문의를 유도하는 자리에서는 전부 걷어낸다.**

### 5. 마이페이지 — 내 문의 내역

`app/(site)/mypage/page.tsx`는 이미 `dynamic = "force-dynamic"` server component다.
기존 "내 정보" 아래에 섹션을 추가한다.

조회는 `getSupabaseAdmin()`으로 두 테이블을 `user_id` 기준으로 각각 가져와
`created_at` 기준 내림차순으로 병합한다. 페이지네이션은 두지 않고 최근 20건까지만 보여준다
(개인의 문의 건수가 그 이상 쌓일 시나리오가 아직 없다).

행에 표시할 것: 접수일 · 유형(교육 문의 / 대관 문의) · 과정명 또는 희망일 · 상태 뱃지.
문의 본문은 접어두고 펼쳐 볼 수 있게 한다.

상태 라벨은 `lib/admin-inquiries.ts`의 `STATUS_LABEL`(신규 / 응대 중 / 완료)을 그대로 쓴다.
어드민과 고객이 다른 단어를 보면 통화할 때 말이 어긋난다.

내역이 없으면: "아직 문의 내역이 없습니다" + `/contact` 링크.

**조회 실패 시 마이페이지 전체를 죽이지 않는다.** 내 정보는 그대로 보여주고
문의 내역 자리에만 오류 안내를 띄운다.

### 6. 회원가입 — 뉴스레터 선택 동의

`signup-form.tsx`의 개인정보 동의 체크박스 아래에 선택 항목을 추가한다.

> 교육 개설 소식과 뉴스레터를 이메일로 받겠습니다. **(선택)**

`api/auth/signup/route.ts`는 `marketingAgreed: boolean`을 payload에서 받아,
`true`일 때만 가입 성공 후 `newsletter_subscribers`에 `source: "signup"`으로 upsert하고
`customer_profiles.marketing_agreed_at`을 `now()`로 갱신한다.

**뉴스레터 등록 실패가 회원가입을 실패시키지 않는다.** `auth.signUp()`이 성공했다면
계정은 이미 만들어진 상태이므로 4xx/5xx를 돌려주면 사용자가 재시도해 중복 가입 오류를 만난다.
실패는 `console.error`로 서버 로그에만 남기고 가입은 201로 응답한다.

이후 `/support` FAQ의 "가입자는 교육 개설이 확정되면 뉴스레터를 받게 되며" 문구를
"가입 시 뉴스레터 수신에 동의하시면"으로 수정해 실제 동작과 맞춘다.

## 손대지 않는 것

- 어드민 문의 화면(`/admin/inquiries/*`) — 목록·상태 변경이 이미 동작한다.
  이번 변경으로 어드민 업무 방식은 바뀌지 않는다. 답변을 사이트에서 주고받는 기능은 범위 밖이다.
- 문의 상태 enum(`new` / `contacted` / `closed`)
- 두 문의 테이블의 RLS 정책
- `/contact`·`/rentals` 폼의 필드 구성과 검증 규칙
- rate limiter 설정

## 검증

이 프로젝트에는 테스트 스위트가 없다(`frontend/CLAUDE.md`). 검증은 다음으로 한다.

1. `cd frontend && npm run lint && npm run build` — 통과해야 한다.
2. 로컬 수동 확인:
   - 로그아웃 상태로 `/contact` 제출 → 접수 완료, 어드민 목록에 노출, `user_id`가 `null`
   - 로그아웃 상태로 `/rentals` 제출 → 위와 동일
   - 로그인 상태로 `/contact` 제출 → 필드 자동 채움 확인, 접수 후 `/mypage`에 노출
   - 로그인 상태로 `/rentals` 제출 → 이름·연락처 자동 채움, `/mypage`에 노출
   - 뉴스레터 미체크 가입 → `newsletter_subscribers`에 행이 생기지 않음
   - 뉴스레터 체크 가입 → 행 생성 + `marketing_agreed_at` 기록
   - `/contact`·`/rentals`·`/support` 전체 텍스트에 전화번호가 없음
   - `/rentals`가 여전히 ISR로 동작(페이지 소스에 예약 현황이 미리 렌더됨)
3. `grep -rn "070-" frontend/src` 결과가 `lib/site.ts` 한 줄뿐이어야 한다.

## 미해결 / 후속

- `070-7606-7586`이 실제로 사용 중인 번호인지 확인 필요. 사용 중이라면 폐기가 아니라
  둘 중 하나로 통일하는 결정이 필요하다.
- 문의 답변을 사이트에서 주고받는 기능(어드민 답변 작성 → 마이페이지 노출)은 다음 단계 후보.
- 뉴스레터 실제 발송 경로는 여전히 미구현이다(`newsletter_issues` 테이블만 존재).
  동의를 받아두는 것과 보내는 것은 별개 작업이다.
- AI 챔피언 소개 페이지 개선은 별도 스펙으로 진행한다.
