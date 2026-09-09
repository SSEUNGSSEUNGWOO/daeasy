-- 주제 자유 입력으로 전환 (예시 A~J 선택 제거). 제목·한 문장·제출자만 받는다.
alter table public.team_topics drop column topic_code;
notify pgrst, 'reload schema';
