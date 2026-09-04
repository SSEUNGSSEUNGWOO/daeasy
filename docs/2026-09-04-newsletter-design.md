# 뉴스레터 자동 발송 — 설계

작성: 2026-09-04

## 배경

- 구독 수집은 두 경로(가입 시 마케팅 동의 / 마이페이지 토글)로 이미 `newsletter_subscribers` 에 쌓이고 있었으나 **보내는 코드가 없었다**. `newsletter_issues` 는 스키마만 존재. 비회원 구독 API(`/api/newsletter/subscribe`)는 있었지만 부르는 화면이 없었다.
- 승우님 고민: "다 보여주면 사이트에 안 온다". → 메일은 **티저**만. 본문은 사이트에서 읽게 해 조회·좋아요·문의 전환을 웹에서 잡는다.

## 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 발송 시점 | `insights/run.py` 의 DB 업로드 직후 | 발행을 소유한 곳이 파이프라인. 실패가 터미널에 바로 보인다 |
| 발송 주체 | ai-service Python → Resend batch API 직접 호출 | Next.js 경유 route 를 두면 트리거 시크릿이 하나 더 필요. 키는 이미 ai-service `.env` 에 있었다 |
| 메일 내용 | 제목 · 커버 · 항목 헤드라인(`### `) 최대 5개 · "전문 읽기" 버튼 | LLM 호출 없이 Writer 산출물에서 그대로 뽑는다. 본문 미포함 |
| 중복 방지 | `newsletter_issues.insight_slug` 존재하면 생략 | 같은 slug 재발행(ON CONFLICT)이 재발송으로 이어지지 않게 |
| 미리보기 | `NEWSLETTER_TEST_TO` 설정 시 그 주소로만, 기록 없음 | 실발송 전 확인 |
| 수신 거부 | `GET /api/newsletter/unsubscribe?e=<email>&s=<HMAC>` 확인 화면 → `POST` 해지 | 비회원 구독자는 로그인이 없어 토큰 방식. GET 즉시 해지는 메일 스캐너 프리페치 사고가 있어 POST 로만. `List-Unsubscribe(-Post)` 헤더로 원클릭도 지원 |
| 서명 | `HMAC-SHA256(lower(email), NEWSLETTER_UNSUB_SECRET)` hex | DB 컬럼 추가 없이 해지 링크를 만들 수 있다. 시크릿은 ai-service `.env` 와 Vercel 양쪽 동일 값 |
| 구독 자격 | **회원 전용**. 비회원 구독 API·폼은 제거. 인사이트 페이지 CTA 는 비회원이면 `/signup?newsletter=1`(동의 미리 체크), 회원이면 그 자리에서 구독 토글 | 열린 폼은 이메일 검증이 없어 남의 주소 등록·반송 누적·동의 없는 발송 위험. 가입은 이메일 인증을 거치고 이름·소속이 붙어 리드로도 쓸 수 있다 |
| 발신자 | `NEWSLETTER_FROM` (기본 `데이지 뉴스레터 <no-reply@daeasy.co.kr>`) | 문의 알림과 같은 Resend 인증 도메인 |

## 미정 / 다음

- Resend 무료 구간(하루 100통, 월 3,000통)을 넘으면 요금제 변경. 코드는 100통 단위 배치라 그대로 간다.
- 인사이트 `summary` 컬럼은 두지 않았다. 헤드라인 목록으로 충분하면 유지, 요약문이 필요해지면 Writer 메타(`<!-- summary: -->`)로 확장.
- 어드민 발송 이력 화면 없음. `newsletter_issues` 를 Supabase Studio 에서 본다.
