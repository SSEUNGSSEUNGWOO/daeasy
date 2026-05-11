-- dataeasy initial schema
-- 어드민 직접 작성 콘텐츠 + ai-service 자동 발행 양쪽 모두 같은 테이블을 공유한다.

create extension if not exists "pgcrypto";

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 콘텐츠 발행 상태 (어드민 / ai-service 공통)
create type public.content_status as enum ('draft', 'published');

-- 교육과정
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  level text not null default 'beginner',         -- beginner / intermediate / advanced
  duration_hours integer not null default 0,
  price integer,                                  -- null = 협의
  thumbnail_url text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_status_idx on public.courses (status, sort_order);
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

-- 교육 사례 (포트폴리오)
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  client_name text,
  conducted_at date,
  course_id uuid references public.courses(id) on delete set null,
  thumbnail_url text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cases_status_idx on public.cases (status, conducted_at desc);
create trigger cases_set_updated_at before update on public.cases
  for each row execute function public.set_updated_at();

-- 가이드 (블로그 / ai-service 자동 발행)
-- 어드민이 손으로 작성하는 가이드와 ai-service가 자동 발행하는 가이드가 같은 테이블을 공유한다.
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',                  -- markdown
  cover_url text,
  category text not null default '',              -- ai-service: AI 기초 / 실무 활용 / 기술 심화 등
  difficulty text not null default '',            -- 입문 / 기초 / 심화
  tldr jsonb not null default '[]'::jsonb,        -- ["핵심1", "핵심2", "핵심3"]
  tags text[] not null default '{}',
  videos jsonb not null default '[]'::jsonb,      -- [{title, url, channel}, ...]
  images jsonb not null default '[]'::jsonb,      -- [{id, type, description, url}, ...]
  evaluation_score numeric,                       -- ai-service Evaluator 점수 (0~5)
  author_name text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guides_status_idx on public.guides (status, published_at desc);
create index guides_tags_idx on public.guides using gin (tags);
create trigger guides_set_updated_at before update on public.guides
  for each row execute function public.set_updated_at();

-- 인사이트 (ai-service 자동 발행 전용 — 일일/격주 동향 리포트)
create table public.insights (
  slug text primary key,
  title text not null,
  body text not null,                             -- markdown
  sources jsonb not null default '[]'::jsonb,     -- [{title, url, source_id}, ...]
  published_at date not null,
  category text not null default 'general',
  image_url text,
  evaluation_score numeric,                       -- 0~5
  crawled_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index insights_published_at_idx on public.insights (published_at desc);

-- 크롤러 수집 raw 항목 (인사이트 작성 입력)
create table public.raw_items (
  item_hash text primary key,
  source_id text not null,                        -- arxiv / github / ai_news / ai_blogs / huggingface
  title text not null default '',
  url text not null default '',
  body text not null default '',
  collected_at date not null,
  created_at timestamptz not null default now()
);
create index raw_items_source_idx on public.raw_items (source_id, collected_at desc);
create index raw_items_collected_at_idx on public.raw_items (collected_at desc);

-- 뉴스레터 구독자
create type public.subscriber_status as enum ('active', 'unsubscribed', 'bounced');

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status public.subscriber_status not null default 'active',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text                                -- 어디서 구독했는지 (homepage, footer 등)
);
create index newsletter_subscribers_status_idx on public.newsletter_subscribers (status);

-- 뉴스레터 발송호
create type public.issue_status as enum ('draft', 'scheduled', 'sent');

create table public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  content text not null default '',          -- HTML or markdown
  insight_slug text references public.insights(slug) on delete set null,  -- 자동 발송 시 연결
  status public.issue_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index newsletter_issues_status_idx on public.newsletter_issues (status, scheduled_at);
create trigger newsletter_issues_set_updated_at before update on public.newsletter_issues
  for each row execute function public.set_updated_at();

-- 교육 문의
create type public.inquiry_status as enum ('new', 'contacted', 'closed');

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  course_id uuid references public.courses(id) on delete set null,
  message text not null default '',
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);
create index contact_inquiries_status_idx on public.contact_inquiries (status, created_at desc);
