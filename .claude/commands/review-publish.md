---
description: 홍보자료 접수 건을 오케스트레이터 파이프라인(ai-service/promo)으로 처리 — 사이트는 공개까지, 네이버는 발행 직전까지
---

이 명령은 `ai-service/promo/` 의 홍보발행 오케스트레이터를 실행하는 래퍼다. 절차는 그 Python 코드가
강제한다 — 이 세션이 글을 쓰거나 검수하지 않고, 파이프라인을 실행하고 결과 보고서를 요약해 전달하는 것까지만 한다.
사용법·설정·에러 대처는 `ai-service/promo/README.md` 에 있다.

> **이 명령은 사이트에 글을 공개한다.** `promo/config.yaml` 의 `publish.site: true`(기본)이면 품질 검사를
> 통과한 글이 사람 확인 없이 daeasy.co.kr 교육후기에 곧장 공개된다. 공개 전에 사람이 보고 싶으면
> 실행 전에 그 값을 `false` 로 바꾼다 (그러면 draft 로만 올라간다). 네이버는 설정과 무관하게 항상
> 발행 직전에 멈춘다.

## 절차

1. **실행**: `ai-service/` 디렉토리에서 실행한다. 인자로 slug 가 주어지면 `--slug` 로 넘긴다.
   ```powershell
   cd <저장소 루트>\ai-service
   uv run python promo/run.py                 # 전체 접수 건
   uv run python promo/run.py --slug <slug>   # 특정 건만
   ```
   - 오래 걸린다. 최악의 경우 사이클 2회 × (judge 5 + 재작성 5 + review 5 + 재작성 5) + 최종 재판정으로
     claude 호출이 40회를 넘고, 호출 하나당 최대 15분이다. **반드시 백그라운드로 실행**하고
     `promo/logs/YYYYMMDD.log` 로 진행을 확인한다.
   - pr-publish 프로젝트가 없는 PC 에서는 시작하자마자 exit 1 이다 (`prpub.root 가 pr-publish 프로젝트가
     아닙니다`). 경로는 `promo/config.yaml` 의 `prpub.root` 이고, PC 마다 다르면 환경변수 `PRPUB_ROOT` 로 덮어쓴다.
   - lock 거부(exit 1, "다른 실행이 진행 중") 이면 다른 실행 여부를 확인하고 사용자에게 알린다.
     stale lock 은 10분 뒤 자동 회수된다.
   - 중간에 죽어도 재실행하면 `promo/state/` 에서 이어서 진행하므로, 실패 시 원인 확인 후 그냥 재실행하면 된다.

2. **보고**: 실행이 끝나면 `promo/output/` 의 최신 `실행보고서_*.md` 를 읽고 사용자에게 요약한다.
   - 건별 단계 상태, judge 점수(통과선 12/14), 접수 제외 건과 전달 문구, 채널별 결과(사이트/네이버)를 빠짐없이 전한다.
   - **사이트 결과가 `ok` 이면 이미 공개된 것이다.** 공개 주소를 함께 알린다. 내용에 문제가 있으면
     어드민(`promo/config.yaml` 의 `prpub.admin_url`)에서 draft 로 내리거나 삭제하라고 안내한다.
   - `스킵(세션 없음)` 이면: pr-publish 루트에서 `uv run prpub site-login` / `uv run prpub naver-login` 후
     재실행하면 그 채널만 재시도된다고 안내한다.
   - `judge 루프 상한` / `점수 정체` / `stalled_regression` 은 오류가 아니라 설계된 중단이다.
     항목별 점수 이력을 보여주고, 재료 부족(항목3)이면 등록자 양식 보완을 권한다. 억지로 통과시키지 않는다.

3. **네이버 발행 (사용자 명시적 확인 후에만)**: 네이버는 파이프라인이 발행하지 않는다. 미리보기 PNG
   (`out/<slug>/naver_미리보기1.png`)를 사용자가 확인하고 발행하라고 말한 경우에만, pr-publish 루트에서 실행한다:
   ```powershell
   cd <pr-publish 루트>
   uv run prpub naver <slug> --publish
   ```
   확인 없이 이 단계를 먼저 실행하지 않는다. 사이트는 1단계에서 이미 공개됐으므로 여기서 다시 올리지 않는다.

## 주의

- 이 저장소에는 아무것도 커밋하지 않는다 — 사이트 반영은 prpub 가 어드민 API 로 Supabase `cases` 에 올린다.
  `promo/{state,logs,output}/` 은 gitignore 되어 있다
- 원고(`brief.md`·`post.md`·`naver.md` 등)는 밑단 도구 pr-publish 의 `out/<slug>/` 에 생긴다
- 절차·프롬프트(`promo/prompts/`)·설정(`promo/config.yaml`)을 고칠 일이 생기면 이 파일이 아니라 `promo/` 를 고친다
- `.claude/agents/{정보수집,글검수,발행검수}.md` 는 옛 에이전트 주도 방식의 잔재로 이 명령이 쓰지 않는다
