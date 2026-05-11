# dataeasy

AI · 데이터 교육 회사 사이트.

- 교육과정 소개 / 신청
- 진행한 교육 사례 (포트폴리오)
- AI · 데이터 가이드 (블로그)
- 뉴스레터 (자체 운영)
- 어드민 페이지 (콘텐츠 관리 · 뉴스레터 발송)

## 구조

```
dataeasy/
├── frontend/      Next.js 16 + TS + Tailwind (사이트 + 어드민 UI)
├── backend/       FastAPI + uv (Supabase 연동, 트랜잭셔널 API)
├── ai-service/    인사이트 / 가이드 자동 발행 파이프라인 (uv, claude CLI 서브프로세스)
├── supabase/      DB 스키마 / 마이그레이션 / RLS
├── .claude/
│   └── commands/  슬래시 명령어 (/insight-publish, /guide-publish)
├── docs/
└── CLAUDE.md      이 프로젝트 작업 가이드
```

## 셋업

### 1. Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### 2. Backend
```bash
cd backend
uv sync
cp .env.example .env  # Supabase 키 등 채우기
uv run uvicorn app.main:app --reload   # http://localhost:8000
```

### 3. Supabase
- `supabase/migrations/` 의 SQL을 순서대로 실행 (Studio SQL Editor 또는 CLI)
- 자세한 내용은 `supabase/README.md`

### 4. AI 서비스 (인사이트 / 가이드 자동 발행)
```bash
cd ai-service
uv sync
cp .env.example .env  # RESEND, OPENAI, DATABASE_URL 등 채우기
```

`claude` CLI 서브프로세스로 동작 — Anthropic Max 구독을 사용하며 `ANTHROPIC_API_KEY`는 비워둔다.

## 슬래시 명령어

`.claude/commands/` 안의 명령어는 Claude Code에서 실행:

- `/insight-publish` — 크롤러 → Writer → Image → Proofreader → Evaluator → DB 업로드 → 뉴스레터 발송
- `/guide-publish` — 주제 추천 → YouTube/웹 수집 → Writer-Evaluator 루프 → Editor → 이미지 프롬프트 출력 → DB 발행

## 단계별 로드맵

- [x] **1단계 — 스캐폴딩**: 모노레포 골격, 빈 라우트, DB 스키마 초안
- [x] **Phase A — ai-service 골격 이식**: public-ax 패턴 그대로 복사 + 슬래시 명령어
- [ ] Phase B — DB 통합 (insights / guides 테이블 + connection을 Supabase로)
- [ ] Phase C — dataeasy 맥락화 (크롤러 / 프롬프트 / rubric 수정)
- [ ] Phase D — `/insight-publish` `/guide-publish` E2E 검증
- [ ] 2단계 — 공개 페이지 콘텐츠 + 디자인
- [ ] 3단계 — 어드민 페이지 (콘텐츠 CRUD)
- [ ] 4단계 — 인증 / 권한 / 배포
