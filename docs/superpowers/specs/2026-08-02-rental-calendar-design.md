# 강의실 대관 예약 현황 캘린더 — 설계

작성일: 2026-08-02

## 배경

`/rentals` 는 신청 폼만 있고 예약 현황을 보여주지 않는다. 방문자는 원하는 날짜가
비어 있는지 문의해봐야만 알 수 있다. CTA 문구도 "일정 확인부터 도와드립니다"로
바꿨으니, 실제로 일정을 확인할 수단을 제공한다.

확정 예약을 기록하는 데이터가 지금 어디에도 없다. `rental_inquiries` 는 **신청**
(status: new/contacted/closed)이지 확정이 아니고, 전화로 성사되는 예약은 시스템에
아예 안 들어온다. 그래서 **어드민이 확정 예약을 직접 등록**하는 모델로 간다
(승인된 결정).

## 목표

- 방문자가 `/rentals` 에서 월 단위로 예약 가능 여부를 본다
- `admin` 이 어드민에서 확정 예약(전화 예약 포함)을 등록·삭제한다

## 범위 밖 (YAGNI)

- 신청 폼과 캘린더 연동 (날짜 클릭 → 폼 자동 입력)
- 신청 폼에서 예약된 날짜 제출 차단
- 시간 단위 예약, 반복 예약
- 구글 캘린더 동기화
- `editor` 의 일정 등록 — 대관은 콘텐츠가 아니라 운영 영역. 기존 권한표
  (editor = 교육과정·교육후기만)를 유지한다

## 데이터 모델

마이그레이션 1개: `supabase/migrations/20260802120000_rental_bookings.sql`

```sql
create type public.rental_slot as enum ('full', 'am', 'pm');

create table public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_date date not null,
  slot public.rental_slot not null,
  memo text not null default '',   -- 내부용. 사이트에 절대 노출하지 않는다
  created_at timestamptz not null default now()
);
create index rental_bookings_date_idx on public.rental_bookings (booking_date);

-- profiles 패턴: RLS 켜고 정책 0개 = service_role 전용.
-- 공개 노출은 서버 컴포넌트가 booking_date, slot 두 컬럼만 뽑아 내려준다.
alter table public.rental_bookings enable row level security;
```

같은 날짜 중복 규칙은 DB 제약이 아니라 **API 에서 검사**한다
(full ↔ am/pm 충돌은 unique 제약으로 표현이 안 됨):

- 같은 날 `full` 이 있으면 어떤 슬롯도 추가 불가
- 같은 날 `am`+`pm` 이 있으면 `full` 추가 불가, 같은 슬롯 중복 불가

## 공개 캘린더 (`/rentals`)

- "예약 현황" 섹션 신설 — 시설 안내와 대관 신청 폼 사이
- 서버 컴포넌트가 service_role 로 `booking_date, slot` 만 조회 (오늘 이후 ~ 3개월)
  → 클라이언트 캘린더 컴포넌트에 props 로 전달. memo 는 서버 밖으로 안 나간다
- 월 캘린더, 이번 달부터 앞으로만 이동 (과거 이동 없음, 조회 범위인 3개월까지)
- 날짜 상태 4가지: 가능 / 오전 예약 / 오후 예약 / 마감 (full 또는 am+pm)
- 외부 라이브러리 없이 구현 — 날짜 계산은 `Date` 로 충분하다
- 페이지에 `revalidate = 60` 추가 (현재 빌드 시 고정이라 갱신 안 됨)

## 어드민 (`/admin/rental-schedule`)

- 사이드바 "문의" 그룹에 "대관 일정" 항목 추가 (**admin 전용** — editor 에겐 그룹째 안 보임)
- 화면: 월 이동 + 날짜별 예약 목록(슬롯·메모) + 추가 폼(날짜·슬롯·메모) + 삭제
- 페이지는 `requireRole("admin")`, `dynamic = "force-dynamic"`

## API

- `POST /api/admin/rental-bookings` — 추가. 충돌 검사 후 409
- `DELETE /api/admin/rental-bookings/[id]` — 삭제
- 가드: `getCurrentUser()` + `admin` 역할 (`forbidden()` 패턴)
- 공개 read API 는 만들지 않는다 — 서버 컴포넌트 직조회로 충분

## 검증

`npm run lint && npm run build` + 수동:

1. admin 으로 일정 등록(전일/오전/오후 각 1건) → `/rentals` 캘린더에 마감/부분 표시
2. 같은 날 충돌 등록 시도 → 409
3. 삭제 → 캘린더에서 사라짐 (60초 내)
4. editor 로그인 → 사이드바에 "대관 일정" 안 보임 + URL 직접 접근 차단 + API 403
5. `/rentals` HTML 응답에 memo 문자열이 없는지 확인
