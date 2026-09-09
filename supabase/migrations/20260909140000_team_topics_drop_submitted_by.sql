-- 제출자 입력 제거 (조 번호·제목·한 문장만 받는다).
alter table public.team_topics drop column submitted_by;
notify pgrst, 'reload schema';
