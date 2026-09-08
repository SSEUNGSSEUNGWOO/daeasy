-- 팀 프로젝트 조별 주제 제출 (임시, docs/2026-09-09-team-topic-design.md).
-- 조당 1행(team_no PK), 재제출은 upsert. 행사 끝나면 drop table.

create table if not exists public.team_topics (
  team_no int primary key check (team_no between 1 and 30),
  topic_code text not null,
  title text not null,
  one_liner text not null,
  submitted_by text not null,
  updated_at timestamptz not null default now()
);

alter table public.team_topics enable row level security;
-- 정책 없음 = anon/authenticated 전부 차단, service_role 전용 (profiles 와 같은 패턴).
-- 읽기·쓰기 모두 /api/team-topic Route Handler 경유.

notify pgrst, 'reload schema';
