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
