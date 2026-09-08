-- 문의·대관·뉴스레터 INSERT 는 전부 Next.js Route Handler 가 service_role 로 한다
-- (frontend/src/app/api/{contact,rentals}/inquiries, api/auth/{signup,newsletter}).
-- anon 정책·grant 는 쓰는 곳 없이 열려만 있어, 공개 anon 키로 검증·rate limit 없이 문의를
-- 넣거나, 남의 이메일을 active 구독자로 등록해 우리 뉴스레터를 스팸 통로로 쓸 수 있었다.
-- RLS 는 켜져 있으므로 정책만 지우면 anon·authenticated 모두 막힌다. grant 는 마이그레이션이
-- 명시적으로 줬던 것이라 같이 회수한다.

drop policy if exists "contact submit" on public.contact_inquiries;
drop policy if exists "rental submit" on public.rental_inquiries;
drop policy if exists "newsletter subscribe" on public.newsletter_subscribers;

revoke insert on public.contact_inquiries from anon;
revoke insert on public.rental_inquiries from anon;
revoke insert on public.newsletter_subscribers from anon;
