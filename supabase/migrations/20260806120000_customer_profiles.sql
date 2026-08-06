-- 일반 고객 계정 정보. 어드민 profiles 테이블과 권한 경계를 분리한다.

create table public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (char_length(email) between 3 and 254),
  name text not null check (char_length(name) between 1 and 50),
  phone text not null check (char_length(phone) between 1 and 20),
  organization text not null check (char_length(organization) between 1 and 100),
  privacy_agreed_at timestamptz not null default now(),
  privacy_policy_version text not null default '2026-08-06',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customer_profiles_set_updated_at before update on public.customer_profiles
  for each row execute function public.set_updated_at();

-- 고객 정보는 본인 브라우저에서도 직접 조회하지 않는다.
-- 모든 접근은 인증을 확인하는 Route Handler 또는 Server Component의 service_role을 통한다.
alter table public.customer_profiles enable row level security;

-- 일반 signUp은 service_role을 쓰지 않으므로 auth.users 생성과 같은 트랜잭션에서
-- 고객 프로필을 만든다. 어드민 계정은 account_type이 없어 이 트리거를 건너뛴다.
create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'account_type' = 'customer' then
    insert into public.customer_profiles (id, email, name, phone, organization)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'phone',
      new.raw_user_meta_data ->> 'organization'
    );
  end if;
  return new;
end;
$$;

create trigger on_customer_auth_user_created
  after insert on auth.users
  for each row execute function public.create_customer_profile();
