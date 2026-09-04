-- 2026-09-04 운영 DB 전수 대조에서 드러난 드리프트를 저장소 쪽에 반영한다.
-- 목적: 이 파일까지 순서대로 돌리면 새 환경이 운영 DB 와 같아지게. 운영엔 전부 idempotent (이미 그 상태).
-- 대조 결과: 14개 테이블 중 customer_profiles 만 달랐고, 그 외 함수 1개·이벤트 트리거 1개·스토리지 버킷 1개가 운영에만 있었다.

-- 1) customer_profiles — 20260806120000 이 선언한 CHECK 4개는 운영에 없다 (길이 검증은 API 가 한다).
--    phone 기본값 '' 는 운영에만 있다. 개정 방침 버전 기본값은 add column if not exists 가 새 환경에서 no-op 라 별도로 맞춘다.
alter table public.customer_profiles
  drop constraint if exists customer_profiles_email_check,
  drop constraint if exists customer_profiles_name_check,
  drop constraint if exists customer_profiles_phone_check,
  drop constraint if exists customer_profiles_organization_check,
  alter column phone set default '',
  alter column privacy_policy_version set default '2026-09-04';

-- 2) 새 테이블에 RLS 를 자동으로 켜는 이벤트 트리거 — 운영에 손으로 넣어져 있던 것.
--    "RLS 는 항상 켠 상태가 기본" (CLAUDE.md) 을 DB 가 강제한다.
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $$
declare
  cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name = 'public' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    end if;
  end loop;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
    create event trigger ensure_rls on ddl_command_end
      when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      execute function public.rls_auto_enable();
  end if;
exception when insufficient_privilege then
  raise notice 'ensure_rls 이벤트 트리거는 슈퍼유저 권한이 필요해 건너뜀 — 대시보드 SQL 편집기에서 실행';
end $$;

-- 3) ai-service 가 인사이트 본문 이미지를 올리는 버킷 — 운영에만 있었다. 공개 버킷이라 읽기 정책 불필요.
insert into storage.buckets (id, name, public)
values ('insight-images', 'insight-images', true)
on conflict (id) do nothing;
