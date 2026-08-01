# dataeasy 프로젝트 작업 가이드

> 사용자 전역 설정(`~/.claude/CLAUDE.md`)이 우선 적용됨. 이 문서는 그 위에 프로젝트 특화 규칙만 보충.

## 모노레포 구조

```
frontend/    # Next.js 16 + App Router + TS + Tailwind (npm) — 사이트 + API Route Handler
ai-service/  # 인사이트/가이드 자동 발행 파이프라인 + uv (Python 3.12) — 로컬 실행 전용
supabase/    # 스키마 SQL + RLS
scripts/     # 루트 일회성 유틸 (이미지 정규화 등). 파이프라인 아님
.claude/     # 슬래시 명령어 (commands/)
docs/
```

작업 시작 전 어느 디렉토리인지 명확히 한다. 패키지·설정은 항상 해당 서브 디렉토리 안에서 처리한다.

**더 깊은 문서** (이 파일에 복붙하지 말고 필요할 때 읽는다):
- `docs/architecture.md` — 데이터 흐름 다이어그램 / 책임 분리 / 보안 원칙 / 미정사항
- `supabase/README.md` — 테이블별 용도·쓰는 주체 표, RLS 정책 요약, 발행 상태 모델

> **note:** 옛 `backend/` (FastAPI) 는 폐기됨. 트랜잭셔널 API 는 모두 `frontend/src/app/api/*/route.ts` (Next.js Route Handler) 로 이식. 옛 코드는 `archive/backend-fastapi` 브랜치에 보관.

## Frontend (Next.js)

- 명령어 (frontend/): `npm run dev` (http://localhost:3000) / `npm run build` / `npm run lint`
- **테스트 스위트가 없다** (jest/vitest/playwright 모두 미도입). 변경 검증은 `npm run lint && npm run build` 가 전부 — 단위 테스트를 찾지 말고 이 둘로 확인한다. ai-service 는 `uv run ruff check .`
- **Next.js 16은 학습 데이터와 다르다** — 새 코드를 짜기 전 `frontend/node_modules/next/dist/docs/` 의 관련 가이드를 먼저 읽는다. APIs / 컨벤션 / 파일 구조가 모두 깨질 수 있다 (`frontend/AGENTS.md`)
- App Router (`src/app/...`), 라우트 그룹은 필요해질 때 도입
- 타입: `any` 금지 (전역 규칙). `unknown` + 좁히기 사용
- 데이터 페칭: 서버 컴포넌트 우선, 클라이언트 상태 필요한 곳만 `'use client'`
- 스타일: Tailwind. 임의 색상 남발 금지. 디자인 토큰 정의되면 그것만 사용
- **read 경로가 두 갈래다** — 헷갈리면 draft 가 안 보이는 원인이 된다
  - 공개 페이지: server component 가 `frontend/src/lib/{insights,guides,cases,courses}.ts` 를 통해 `supabase` (anon) 호출. RLS 가 published 만 노출
  - 어드민 페이지: server component 가 `getSupabaseAdmin()` (service_role) 로 **직접** 조회 — draft 포함 전체를 본다. `lib/*.ts` 의 공개용 fetch 함수를 재사용하면 안 된다
- 데이터 write / RPC: client 가 `/api/*` (Next.js Route Handler) 호출 → Handler 가 `getSupabaseAdmin()` (service_role) 또는 외부 API 호출
- 캐싱: 공개 인사이트 목록·상세는 `export const revalidate = 60` (ISR), 어드민 페이지는 전부 `export const dynamic = "force-dynamic"`. 새 페이지 추가 시 같은 쪽을 따른다
- DB·외부에서 온 HTML 을 `dangerouslySetInnerHTML` 에 넣기 전에는 **반드시** `lib/sanitize.ts` 의 `sanitizeHtml()` 을 거친다 (허용 태그·속성 화이트리스트가 거기 있다)
- Rate limiter: `frontend/src/lib/rate-limit.ts` (Upstash Redis 기반). `UPSTASH_REDIS_REST_URL/TOKEN` 없으면 자동 noop (로컬 개발 편의)
- 정적 이미지: `public/<카테고리>/` 단위(logo / partners / hero / about / reviews). 같은 파일을 덮어쓰면 Next.js Image 캐시가 stale 응답으로 잡혀 dev에서도 안 갱신된다 — **갱신 시 파일명을 바꾸거나** `unoptimized` 추가. querystring(`?v=2`) 우회는 Next.js 16에서 `images.localPatterns` 미등록 시 런타임 에러
- 이미지 처리(크롭·리사이즈·포맷 변환): Windows 환경에선 **PowerShell + `System.Drawing`** 이 가장 가볍다(Pillow·ImageMagick 의존 없음). 대량 일괄 통일은 `dataeasy/scripts/normalize_partners.py` (uv inline `pillow + svglib + reportlab`) 패턴 참고 — Cairo 시스템 라이브러리 없이 SVG 래스터화까지 가능

### 어드민 인증 / 라우트 가드

- **`frontend/src/proxy.ts` 가 Next.js 16 의 `middleware.ts` 다** — 파일명도 export 이름도 `middleware` 가 아니라 `proxy`. 학습 데이터대로 `middleware.ts` 를 새로 만들면 조용히 무시된다. matcher 는 `/admin/:path*`
- 방어는 두 겹이고 **둘 다 필요하다**: (i) `proxy.ts` 가 쿠키 없으면 `/admin/login` 리다이렉트, (ii) 각 `/api/admin/*` 핸들러가 다시 `isAdminAuthed()` 검사. 새 어드민 API 를 추가할 때 프록시만 믿고 (ii) 를 빼면 인증 우회가 된다
- 인증 모델: 단일 `ADMIN_PASSWORD`, 쿠키 값은 그 비밀번호의 sha256, 비교는 `timingSafeEqual` (`lib/admin-auth.ts`). 세션 개념이 없어 개별 쿠키 폐기 불가 — 유출 시 `ADMIN_PASSWORD` 교체가 유일한 무효화 수단

## AI Service (인사이트 / 가이드 파이프라인)

- 원본 패턴 출처: `SSEUNGSSEUNGWOO/public-ax`. dataeasy 맥락으로 점진적으로 수정 중
- 가상환경: `ai-service/` 안에서 `uv sync` / `uv run`. backend와 분리
- 직접 실행: `uv run python insights/run.py` / `uv run python guides/run.py "<주제>"`. 슬래시 명령어(`/insight-publish`, `/guide-publish`)가 이걸 감싸 호출
- 진입점은 각각 `insights/run.py`, `guides/run.py` — 파이프라인 단계 수정은 거기서부터 따라가면 된다
- LLM: Writer / Proofreader / Image Agent 키워드 추출은 **`claude` CLI 서브프로세스**. `ANTHROPIC_API_KEY` 는 의도적으로 비워둠 (Anthropic Max 구독 소비). `os.environ.pop("ANTHROPIC_API_KEY", None)` 패턴은 의도된 것
- **Evaluator 는 `codex` CLI 별도 사용** — `claude` 외에 codex 도 PATH 에 있어야 발행이 끝까지 통과 (`evaluator.evaluate_with_codex_cli`)
- 평가 루프: `evaluator/rubric.yaml` 7개 기준 (factual_accuracy / relevance / insight_quality / source_linkage / seo_quality / human_voice / image_relevance), 가중평균 4.0/5.0 미만이면 Writer 최대 3회 재실행. **image_relevance 만 부족하고 텍스트 평균이 통과면 image_agent 만 재실행** (다른 출처 og:image + 다른 Unsplash random)
- DB 연결: `shared/db.py` 의 `psycopg2` direct connection. `DATABASE_URL` 은 **Supabase Session pooler URL** (`postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres`). RLS 우회로 INSERT/SELECT/DELETE 가능 (frontend 의 supabase-js 는 RLS 적용 — 두 경로의 권한 모델이 다름을 항상 의식)
- 이미지: 커버는 Unsplash (검색어를 claude CLI 가 헤드라인에서 추출). 본문 항목별은 출처 페이지의 `og:image` → `twitter:image` → 본문 첫 의미있는 `<img>` fallback. arxiv 등은 `EXCLUDE_DOMAINS` 로 스킵

### 슬래시 명령어 (`.claude/commands/`)

- `/insight-publish` — 인사이트 1건 발행 (크롤 → 작성 → 이미지 → 평가 → DB)
- `/guide-publish` — 가이드 1건 발행 (주제 추천 → YouTube/웹 수집 → 작성-평가 루프 → 이미지 → DB)

명령어 추가 시 같은 패턴(frontmatter `description` + 단계별 지시)을 따른다.

### 인사이트 본문 메타 규약

- 본문 첫 줄에 `<!-- tags: 태그1, 태그2, ... -->` HTML 코멘트 — Writer 가 강제 출력. `extract_tags()` 추출 후 `strip_tags_meta()` 가 본문에서 제거하고 DB `tags text[]` 컬럼에 별도 저장
- 헤드라인 `# ...` 첫 줄은 `strip_first_h1()` 으로 제거 후 저장 — 제목은 `title` 컬럼에 별도. Frontend 의 `.replace(/^#\s+[^\n]+\n+/, "")` 는 옛 row 호환용 안전장치
- Proofreader 는 HTML 코멘트(`<!-- ... -->`)를 절대 제거하지 않도록 (i) 프롬프트 명시 + (ii) `run_proofreader()` 가 메타 라인을 분리해 LLM 입력에서 빼고 결과에 다시 붙이는 안전장치 — 둘 다 동시 적용 (`evaluator` 가 메타 사라지면 image_relevance 도 못 매김)

## 로컬 셋업 함정 (Windows 특화)

이번 환경에서 매번 새 instance 가 마주치기 쉬운 다섯 가지 — 한 번 해결한 패턴을 잊지 않기 위함.

1. **`tzdata` 필수** — Python `zoneinfo("Asia/Seoul")` 가 IANA tzdata 없으면 `ZoneInfoNotFoundError`. `cd ai-service && uv add tzdata`. `shared/storage.py` 가 KST 기준 어제+오늘 디렉토리를 스캔해서 raw_items 합치기 때문에 이게 안 되면 크롤러 import 단계에서 죽음
2. **`claude` / `codex` CLI 호출 시 `subprocess.run(..., shell=True)` + `shutil.which`** — Windows 에선 `["claude", "-p", "-"]` 가 `.cmd` 자동 인식 못 해서 `[WinError 2]` 발생. `writer.py` / `proofreader.py` / `image_agent._extract_unsplash_query` / `evaluator.py` 모두 같은 패턴 — 새 LLM 호출 함수 추가 시 이 패턴 그대로 따라
3. **Supabase 무료 tier 는 direct connection 안 됨** — `db.<ref>.supabase.co:5432` 는 IPv6 only 라 일반 환경에서 DNS 해석 실패. ai-service `.env` 의 `DATABASE_URL` 은 **Session pooler URL** 사용 (host 는 `aws-1-<region>.pooler.supabase.com:5432`, 유저명은 `postgres.<project-ref>` 형태). 사용자가 처음 보내준 direct URL 은 그대로 쓰면 안 됨
4. **Next.js dev (Turbopack) 의 좀비/멈춤** — 코드 변경했는데 옛 응답이거나 페이지가 안 뜨면 `Get-NetTCPConnection -LocalPort 3000 -State Listen` 으로 PID 확인 → `Stop-Process -Id <PID> -Force` → `npm run dev` 재시작. `.env.local` 변경 시 무조건 재시작 필요 (hot reload 안 됨)
5. **Next.js 16 dynamic route slug 더블 인코딩** — `page` 와 `generateMetadata` 가 받는 `params.slug` 의 인코딩 상태가 다를 수 있어 (raw 한국어 vs percent-encoded). `frontend/src/lib/*.ts` 의 fetch 함수들은 `decodeURIComponent(slug)` 로 정규화 후 supabase.eq 에 전달

## Supabase

- 마이그레이션 파일명: `YYYYMMDDHHMMSS_<설명>.sql`
- RLS는 항상 켠 상태가 기본. 새 테이블 추가 시 정책 같이 작성
- **발행 상태는 `public.content_status` enum (`draft` / `published`)** — `courses` / `cases` / `guides` / `insights` 가 같은 컬럼(`status`)을 공유한다. anon 읽기 정책은 `using (status = 'published')`. `is_published` 같은 boolean 컬럼은 존재하지 않는다
- `insights` 는 ai-service 가 `status` 를 지정하지 않고 INSERT 해 default `published` 로 들어가고, `ON CONFLICT` 갱신 목록에도 없다 — 어드민이 draft 로 내린 글은 재발행해도 draft 를 유지한다
- 어드민 쓰기는 service_role 또는 추후 admin role로

## 단계별 작업 원칙

전역 CLAUDE.md의 "외과적(Surgical) 변경" 원칙을 적용:
- 1단계 스캐폴딩 이후, 다음 단계가 아닌 작업은 같은 PR/커밋에 섞지 않는다
- 새 기능 추가 시 인접 코드 "개선" 금지

## 배포

- **Frontend (사이트 + API)**: Vercel. Root Directory = `frontend`
- **DB / RLS / RPC**: Supabase Cloud
- **(선택) Rate limiter**: Upstash Redis (REST API)
- **AI Service**: 배포 없음. 승우님이 로컬에서 `/insight-publish` `/guide-publish` 슬래시 명령으로 발행 → 결과만 Supabase 에 들어감

### Vercel 환경변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — Sensitive 체크 (server-only)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — 없으면 rate limit 비활성
