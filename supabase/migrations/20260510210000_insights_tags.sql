-- 인사이트는 일일 종합 리포트 형태로 여러 주제를 함께 다룬다.
-- 단일 category 표현이 어색해서 다중 tags 컬럼을 도입한다.
-- guides.tags 와 같은 패턴.

alter table public.insights
  add column if not exists tags text[] not null default '{}';

create index if not exists insights_tags_idx
  on public.insights using gin (tags);
