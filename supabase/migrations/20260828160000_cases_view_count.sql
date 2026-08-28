-- 교육후기(cases) 조회수 — insights 와 동일 구조
-- view_count 컬럼 + race condition 없는 +1 RPC

alter table public.cases
  add column if not exists view_count integer not null default 0;

create or replace function public.increment_case_view(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.cases
     set view_count = view_count + 1
   where slug = p_slug
   returning view_count into new_count;
  return new_count;  -- slug 가 없으면 null 반환
end;
$$;

-- anon 도 RPC 호출 가능하게 (insights 와 동일 정책)
grant execute on function public.increment_case_view(text) to anon, authenticated;

notify pgrst, 'reload schema';
