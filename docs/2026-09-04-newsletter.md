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
