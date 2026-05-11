-- 강의실 대관 신청 (DMC타워 교육장)
-- contact_inquiries 와 동일 패턴: anon insert 만 허용, service_role 만 select.

create table public.rental_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  usage_date date,
  time_slot text,                                  -- 전일 / 오전 반일 / 오후 반일 / 기타
  message text not null default '',
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);
create index rental_inquiries_status_idx
  on public.rental_inquiries (status, created_at desc);

alter table public.rental_inquiries enable row level security;

create policy "rental submit"
  on public.rental_inquiries for insert
  to anon, authenticated
  with check (true);

-- Supabase: raw SQL로 만든 새 테이블엔 default privileges가 자동 부여되지 않으므로
-- anon role에 INSERT 권한을 명시적으로 부여한다.
grant insert on public.rental_inquiries to anon;
