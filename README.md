# dataeasy

AI · 데이터 교육 회사 사이트.

- 교육과정 소개 / 신청
- 진행한 교육 사례 (포트폴리오)
- AI · 데이터 가이드 · 인사이트 (자동 발행)
- 장비 대여 문의
- 어드민 페이지 (콘텐츠 관리 · 문의 관리)

## 구조

```
dataeasy/
├── frontend/      Next.js 16 + React 19 + Tailwind v4
│                  └ 공개 사이트 + 어드민 UI + API Route Handler
├── ai-service/    인사이트 / 가이드 자동 발행 파이프라인 (uv, claude·codex CLI 서브프로세스)
├── supabase/      DB 스키마 / 마이그레이션 / RLS
├── scripts/       일회성 유틸 (이미지 정규화 등)
├── .claude/
│   └── commands/  슬래시 명령어 (/insight-publish, /guide-publish)
├── docs/
└── CLAUDE.md      이 프로젝트 작업 가이드
```

별도 백엔드 서버는 없다. 트랜잭셔널 API 는 모두 `frontend/src/app/api/*/route.ts` (Next.js Route Handler) 로 처리한다.
옛 FastAPI 코드는 `archive/backend-fastapi` 브랜치에 보관.

## 셋업

환경변수는 `.env.example` 참고.

### 1. Supabase

`supabase/migrations/` 의 SQL 을 파일명 순서대로 실행 (Studio SQL Editor 또는 CLI).
자세한 내용은 `supabase/README.md`.

### 2. Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local   # frontend 섹션만 채우기
npm run dev                     # http://localhost:3000
```

어드민은 `http://localhost:3000/admin` — Supabase Auth 계정(이메일 + 비밀번호)으로 로그인.
첫 관리자 계정은 Studio 에서 만들고 `public.profiles` 에 `role='admin'` 행을 넣는다.
이후 계정은 관리자가 `/admin/members` 에서 발급한다. 역할은 `admin`(전체) / `editor`(교육과정 · 교육후기만).

### 3. AI 서비스 (인사이트 / 가이드 자동 발행)

```bash
cd ai-service
uv sync
cp ../.env.example .env         # ai-service 섹션만 채우기
```

- `claude` CLI (Writer / Proofreader / 이미지 키워드) 와 `codex` CLI (Evaluator) 가 PATH 에 있어야 한다
- `ANTHROPIC_API_KEY` 는 비워둔다 — Anthropic Max 구독을 사용한다
- 배포하지 않는다. 로컬에서 실행해 결과만 Supabase 에 적재한다

## 슬래시 명령어

`.claude/commands/` 안의 명령어는 Claude Code 에서 실행:

- `/insight-publish` — 크롤러 → Writer → Image → Proofreader → Evaluator → DB 업로드
- `/guide-publish` — 주제 추천 → YouTube/웹 수집 → Writer-Evaluator 루프 → Editor → 이미지 → DB 발행

## 배포

| 대상 | 위치 |
|---|---|
| 사이트 + API | Vercel (Root Directory = `frontend`) |
| DB / RLS | Supabase Cloud |
| Rate limiter (선택) | Upstash Redis |
| ai-service | 배포 없음 (로컬 실행) |

## 진행 상태

- [x] 모노레포 골격, DB 스키마 · RLS
- [x] ai-service 인사이트 파이프라인 (크롤 → 작성 → 평가 → DB) E2E
- [x] ai-service 가이드 파이프라인
- [x] 공개 페이지 (홈 / 소개 / 교육과정 / 사례 / 가이드 / 인사이트 / 대여 / 지원 / 문의)
- [x] 문의 · 대여 접수 API + rate limit
- [x] 어드민 인증 + 문의 관리
- [x] 어드민 교육과정 · 교육 사례 CRUD
- [x] Vercel 배포
- [ ] 뉴스레터 발송 (구독 접수만 구현됨, 발송 경로 · 메일 서비스 미정)
- [x] `/quiz` 교육 추천 (규칙 기반 4문항 → 상위 3개 과정 → 문의 폼 연결)
