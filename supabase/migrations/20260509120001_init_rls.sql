-- Row Level Security 정책
-- 원칙:
--   - 공개 콘텐츠(courses, cases, guides, insights)는 status = 'published'만 anon 읽기
--   - 쓰기는 service_role 전용 (어드민 백엔드 / ai-service)
--   - newsletter_subscribers / contact_inquiries는 anon insert만 허용 (구독·문의 폼)
--   - raw_items / newsletter_issues는 anon 접근 불가 (정책 없음 = 차단)

alter table public.courses enable row level security;
alter table public.cases enable row level security;
alter table public.guides enable row level security;
alter table public.insights enable row level security;
alter table public.raw_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_issues enable row level security;
alter table public.contact_inquiries enable row level security;

-- courses: 공개된 것만 anon 읽기
create policy "courses public read"
  on public.courses for select
  using (status = 'published');

-- cases: 공개된 것만 anon 읽기
create policy "cases public read"
  on public.cases for select
  using (status = 'published');

-- guides: 공개된 것만 anon 읽기
create policy "guides public read"
  on public.guides for select
  using (status = 'published');

-- insights: 모든 인사이트 공개 (자동 발행 시 published만 저장하는 정책)
create policy "insights public read"
  on public.insights for select
  using (true);

-- newsletter_subscribers: anon insert만 (구독 폼)
create policy "newsletter subscribe"
  on public.newsletter_subscribers for insert
  with check (true);

-- contact_inquiries: anon insert만 (문의 폼)
create policy "contact submit"
  on public.contact_inquiries for insert
  with check (true);

-- raw_items / newsletter_issues: 정책 없음 → service_role만 접근 가능
