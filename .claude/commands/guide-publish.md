---
description: 가이드 주제 추천부터 작성·이미지 삽입·DB 발행까지 단계별 진행
---

가이드 발행 워크플로우를 실행한다.

1. 현재 published 목록 확인 (`cd ai-service && python3 guides/publish.py list`)
2. 아직 없는 주제 중 AI · 데이터를 일터에 쓰려는 학습자/실무자에게 유용한 주제 3~5개 추천
3. 사용자가 선택하면 `python3 guides/run.py "주제"` 실행
4. 완료 후 가이드 본문에 들어간 이미지 프롬프트 출력 (COVER, DIAGRAM 등)
5. 사용자가 이미지 생성해서 전달하면 지정 경로(`frontend/public/guides/{slug}-{id}.png`)에 저장
6. `python3 guides/publish.py <slug>` → `python3 shared/upload_to_db.py` 실행

주의:
- `ANTHROPIC_API_KEY` 사용 금지. `claude` CLI 서브프로세스로 동작 (Anthropic Max 구독 소비).
- 평가 통과 기준 4.0/5.0 (`guides/evaluator/rubric.yaml`).
- 가이드 본문의 `{{image:id}}` 플레이스홀더는 이미지 파일이 준비된 뒤 그대로 유지 (프론트엔드 파서가 처리).
- 프론트엔드는 Supabase `guides` 테이블에서 `is_published = true` 인 것만 표시.
