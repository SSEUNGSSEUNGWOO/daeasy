-- insights 발행 상태
-- 지금까지 insights 는 status 컬럼이 없어 ai-service 가 INSERT 하는 즉시 전체 공개였다.
-- 어드민에서 발행물을 내릴 수 있도록 다른 콘텐츠 테이블과 같은 content_status 패턴으로 맞춘다.
-- 기존 행은 모두 공개 상태였으므로 default 'published' 로 그대로 유지된다.

alter table public.insights
  add column if not exists status public.content_status not null default 'published';

create index if not exists insights_status_idx on public.insights (status, published_at desc);

-- anon 읽기를 published 로 제한 (기존 정책은 using (true) 였음)
drop policy if exists "insights public read" on public.insights;

create policy "insights public read"
  on public.insights for select
  using (status = 'published');
