-- A. 조회수 RPC 추가 — race condition 없이 +1
-- (좋아요는 무한 허용 정책 — unique 제약 두지 않음)

create or replace function public.increment_insight_view(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.insights
     set view_count = view_count + 1
   where slug = p_slug
   returning view_count into new_count;
  return new_count;  -- slug 가 없으면 null 반환
end;
$$;

-- anon 도 RPC 호출 가능하게
grant execute on function public.increment_insight_view(text) to anon, authenticated;

-- 혹시 이전 버전 마이그레이션을 실행했다면 unique 제약 제거 (무한 좋아요 정책)
alter table public.insight_likes
  drop constraint if exists insight_likes_slug_fp_uniq;

notify pgrst, 'reload schema';
