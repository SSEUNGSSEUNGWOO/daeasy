-- 교육후기(cases) 좋아요 — insight_likes 와 동일 구조
-- fingerprint 단위 row 적재 (count = COUNT(*)), 중복 허용 ("마음에 드는 만큼")

create table if not exists public.case_likes (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.cases(slug) on delete cascade,
  user_fingerprint text not null,
  created_at timestamptz not null default now()
);
create index if not exists case_likes_slug_idx on public.case_likes (slug);

alter table public.case_likes enable row level security;

-- anon 이 좋아요 카운트를 읽고 추가할 수 있도록
create policy "case_likes public read"
  on public.case_likes for select
  using (true);

create policy "case_likes public insert"
  on public.case_likes for insert
  with check (true);

notify pgrst, 'reload schema';
