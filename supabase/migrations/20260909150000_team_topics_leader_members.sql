-- 조장·조원 입력 추가. 기존 행 호환을 위해 default ''.
alter table public.team_topics
  add column leader text not null default '',
  add column members text not null default '';
notify pgrst, 'reload schema';
