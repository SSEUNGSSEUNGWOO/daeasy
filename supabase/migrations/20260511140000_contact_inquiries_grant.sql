-- contact_inquiries 도 rental_inquiries 와 동일한 함정 방지:
-- raw SQL 로 만든 테이블엔 anon role 의 default privileges 가 자동 부여되지 않으므로
-- INSERT 권한을 명시적으로 부여한다. (브라우저에서 직접 supabase-js 호출 가능성 대비)
-- 백엔드는 service_role 사용하므로 이 grant 없이도 동작하지만, 안전장치.

grant insert on public.contact_inquiries to anon;

-- PostgREST 스키마 캐시 리로드
notify pgrst, 'reload schema';
