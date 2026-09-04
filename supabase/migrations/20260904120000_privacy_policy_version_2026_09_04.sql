-- 개인정보 처리방침 2026-09-04 개정 (자동 수집·아동·보호책임자·권익침해 구제·변경 고지 항목 추가).
-- 이후 가입자는 새 버전에 동의한 것으로 기록한다. 기존 행은 건드리지 않는다 — 실제 동의한 버전이 그것이므로.
alter table public.customer_profiles
  alter column privacy_policy_version set default '2026-09-04';
