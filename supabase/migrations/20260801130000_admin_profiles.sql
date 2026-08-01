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
