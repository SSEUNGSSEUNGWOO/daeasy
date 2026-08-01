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
