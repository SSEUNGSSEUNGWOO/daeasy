-- content-images 스토리지 버킷 생성
-- 어드민에서 courses/cases 썸네일과 본문 이미지를 업로드하는 저장소.
-- write 는 service_role (Next.js Route Handler) 만 수행하고,
-- read 는 anon 도 가능해야 사이트에서 <Image src=""> 로 노출 가능.

insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

-- 익명 read 정책 (public 버킷이지만 storage.objects 는 RLS 적용되므로 명시)
drop policy if exists "content-images public read" on storage.objects;
create policy "content-images public read"
  on storage.objects for select
  to public
  using (bucket_id = 'content-images');

-- write/update/delete 는 service_role 이 RLS 를 bypass 하므로 정책 불필요.
