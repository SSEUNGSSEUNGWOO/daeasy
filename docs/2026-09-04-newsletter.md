# 뉴스레터 자동 발송 — 구현 기록

설계: `2026-09-04-newsletter-design.md`

## 파일

- `ai-service/insights/newsletter.py` — `send(insight)`. 구독자 조회 → 티저 HTML → Resend `/emails/batch` (100통 단위) → `newsletter_issues` 기록. `python insights/newsletter.py` 로 헤드라인 추출·서명 자체 점검 (`PYTHONPATH=.` 필요)
- `ai-service/insights/run.py` — `save_to_insights()` 에서 DB 업로드 성공 시에만 `newsletter_send()` 호출. 예외는 삼키고 출력만 (발행은 이미 끝난 상태)
- `frontend/src/app/api/newsletter/unsubscribe/route.ts` — GET 확인 화면 / POST 해지. HMAC 검증은 `timingSafeEqual`

## 환경변수

| 위치 | 키 | 비고 |
|---|---|---|
| ai-service `.env` | `RESEND_API_KEY` | 기존 |
| ai-service `.env` | `NEWSLETTER_FROM` | `데이지 인사이트 <no-reply@daeasy.co.kr>` 로 갱신 (옛 dataeasy.kr 값이었음) |
| ai-service `.env` | `NEXT_PUBLIC_SITE_URL` | `https://daeasy.co.kr` 로 갱신. 메일의 본문 링크·해지 링크 도메인 |
| ai-service `.env` | `NEWSLETTER_UNSUB_SECRET` | 신규. 해지 링크 서명 |
| ai-service `.env` | `NEWSLETTER_TEST_TO` | 선택. 설정 시 그 주소로만 발송, 기록 없음 |
| frontend `.env.local` + Vercel | `NEWSLETTER_UNSUB_SECRET` | ai-service 와 **같은 값**. 없으면 해지 링크가 전부 400 |

## 검증

- `uv run ruff check insights/newsletter.py` 통과. `run.py` 의 E402 는 기존 sys.path 패턴으로 이미 있던 것
- `npm run lint && npm run build` 통과
- 로컬 `next start` 에 Python 이 만든 서명 URL 로 GET(확인 화면) / POST(해지) 왕복 확인 — 두 언어의 HMAC 이 일치
- `NEWSLETTER_TEST_TO` 로 실제 메일 1통 수신 확인

## Codex 리뷰 반영 (같은 날)

`codex exec -s read-only` 로 오늘 커밋 범위를 리뷰시켜 나온 것 중 반영한 것:

- **재설정 API 가 일반 세션도 받던 문제** — `/auth/confirm` 이 재설정 링크를 통과시킬 때만 `pw-reset` 쿠키(HttpOnly, path=`/api/auth/reset-password`, 10분)를 심고, 재설정 API 는 이 쿠키를 요구한 뒤 성공 시 지운다. 없으면 도난당한 세션이 `/api/auth/password` 의 현재 비밀번호 재확인을 우회하는 통로였다
- **`next` 오픈 리다이렉트** — `/\evil.com` 이 WHATWG URL 파서에서 `//evil.com` 이 된다 (node 로 재현). `/auth/confirm` 과 로그인 폼 둘 다 `/^\/(?![/\])/` 로 조인다
- **Resend `Idempotency-Key`** — `newsletter/<sha256(slug)[:32]>/<배치번호>`. 타임아웃 후 재실행해도 중복 발송 없음. 테스트 발송엔 붙이지 않는다
- **PKCE 제약** — 서버에서 시작한 재설정은 code verifier 가 요청 브라우저 쿠키에 있어 다른 기기에서 링크를 열면 실패한다 (가입 인증도 동일). 안내 문구로 대응. 없애려면 Supabase 메일 템플릿을 `token_hash` 방식(`/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`)으로 바꾸면 된다 — 대시보드 작업이라 미적용

반영하지 않은 것: 배치 일부 실패 시 이력 처리. 구독자 100명 이하라 배치가 하나뿐이고, 실패 수신자를 출력으로 남기는 것으로 갈음 (`ponytail:` 주석)
