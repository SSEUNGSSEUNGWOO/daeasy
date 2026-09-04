---
description: 인사이트 1건 발행 (크롤 → 작성 → 이미지 → 평가 → Supabase) + 구독자 뉴스레터 발송
---

인사이트 발행 워크플로우를 실행한다.

> **이 명령은 구독자에게 메일을 보낸다.** DB 적재가 끝나면 `newsletter_subscribers` 의 활성 구독자
> 전원에게 티저 메일이 나간다. 되돌릴 수 없다. 먼저 눈으로 보고 싶으면 아래 "미리보기" 를 따른다.

## 절차

1. **실행**: `ai-service/` 디렉토리에서 실행한다.
   ```powershell
   cd <저장소 루트>\ai-service
   uv run python insights/run.py
   ```
   - `python3 insights/run.py` 처럼 uv 없이 부르면 안 된다 — 의존성이 가상환경 안에만 있다.
   - 크롤 → Writer → 이미지 → 교정 → 평가로 몇 분 걸린다. **백그라운드로 실행**하고 출력을 확인한다.

2. **보고**: 완료 후 아래를 사용자에게 전한다.
   - 제목, 평가 점수(가중평균 / 통과선 4.0), 출처 수, 태그
   - `[run] DB 업로드 완료: <slug>` 로 Supabase `insights` 적재 확인
   - `[newsletter] N/M명 발송` 으로 메일 발송 결과 확인. `활성 구독자 없음` 이면 아무도 안 받은 것이다

3. **미리보기 (실발송 전에 확인하고 싶을 때)**: `ai-service/.env` 의 `NEWSLETTER_TEST_TO` 주석을 풀고
   받을 주소를 적으면, 그 주소로만 보내고 발송 기록도 남기지 않는다. 확인 후 다시 주석 처리해야
   실제 구독자에게 나간다. 테스트 주소는 `sseung@kbrainc.com`.

## 주의

- `ANTHROPIC_API_KEY` 는 사용하지 않는다. Writer / 교정 / 이미지 키워드 추출은 `claude` CLI 서브프로세스로
  동작하며 Anthropic 구독을 소비한다. `run.py` 가 이 환경변수를 실행 시 제거한다.
- **평가 단계는 `codex` CLI 를 쓴다.** `claude` 와 `codex` 둘 다 PATH 에 있어야 발행이 끝까지 간다.
- 평가 가중평균 4.0/5.0 미달이면 Writer 가 최대 3회 재실행된다. image_relevance 만 미달이면 이미지 단계만 재실행한다.
- 평가를 통과하지 못하면 `insights.json` 에 저장하지 않고 끝난다 — DB 적재도 메일 발송도 없다.
- 발행 결과는 `ai-service/insights/data/insights.json` → Supabase `insights` 테이블에 적재된다.
- 같은 slug 를 재발행해도 뉴스레터는 다시 보내지 않는다 (`newsletter_issues` 기록으로 판정).
