-- 인사이트 좋아요/조회수
-- 좋아요: 별도 테이블에 fingerprint 단위로 row 적재 (count = COUNT(*))
-- 조회수: insights 테이블에 view_count 컬럼 (단순 INCREMENT)

alter table public.insights
  add column if not exists view_count integer not null default 0;

create table if not exists public.insight_likes (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.insights(slug) on delete cascade,
  user_fingerprint text not null,
  created_at timestamptz not null default now()
);
create index if not exists insight_likes_slug_idx on public.insight_likes (slug);

alter table public.insight_likes enable row level security;

-- anon 이 좋아요 카운트를 읽고 추가할 수 있도록
create policy "insight_likes public read"
  on public.insight_likes for select
  using (true);

create policy "insight_likes public insert"
  on public.insight_likes for insert
  with check (true);
