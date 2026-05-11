---
description: 인사이트 파이프라인 실행 → Supabase 업로드까지 자동 수행
---

인사이트 발행 워크플로우를 실행한다.

1. `cd ai-service && python3 insights/run.py` 실행
2. 완료 후 결과(제목, 평가 점수) 출력
3. Supabase 업로드 확인

주의:
- `ANTHROPIC_API_KEY`는 사용하지 않는다. 인사이트 파이프라인은 `claude` CLI 서브프로세스로 동작하며 Anthropic Max 구독을 소비한다.
- 평가 통과 기준 4.0/5.0 미달이면 Writer가 최대 3회 재실행된다.
- 발행 결과는 `ai-service/insights/data/insights.json` → Supabase `insights` 테이블에 적재된다.
