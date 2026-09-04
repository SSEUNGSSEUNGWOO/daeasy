-- 개인정보 처리방침 동의 기록.
-- 20260806120000_customer_profiles.sql 에는 이 두 컬럼이 있었으나 운영 DB 엔 실제로 없었다 (스키마 드리프트).
-- 2026-09-04 방침 개정을 계기로 실제로 추가한다. 가입 트리거(create_customer_profile)는 이 컬럼을 명시하지
-- 않으므로 기본값이 들어간다 — 트리거 변경 불필요.
alter table public.customer_profiles
  add column if not exists privacy_agreed_at timestamptz not null default now(),
  add column if not exists privacy_policy_version text not null default '2026-09-04';

-- 기존 회원은 가입 시점에 최초 시행(2026-08-06) 방침에 동의한 것이다. 기본값(now / 09-04)으로 두면 거짓 기록이 된다.
update public.customer_profiles
   set privacy_agreed_at = created_at,
       privacy_policy_version = '2026-08-06'
 where created_at < '2026-09-04';
