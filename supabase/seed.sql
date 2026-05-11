-- 로컬 개발용 시드 데이터. 실제 콘텐츠는 어드민 페이지 / ai-service에서 관리.

insert into public.courses (slug, title, summary, level, duration_hours, status, sort_order)
values
  ('ai-basics', 'AI 입문', '비전공자를 위한 AI 기초', 'beginner', 16, 'published', 10),
  ('data-analytics', '데이터 분석 실무', 'SQL부터 대시보드까지', 'intermediate', 24, 'published', 20),
  ('llm-for-business', '실무용 LLM 활용', '업무 자동화 사례 중심', 'intermediate', 12, 'published', 30);
