# 홍보발행 오케스트레이터 파이프라인

## 1. 프로젝트 소개

기존 홍보자료 발행 도구(`daeasy-pr-publish`, uv 기반 CLI `prpub`)를 부품으로 재사용해,
**접수부터 발행 직전(draft)까지를 코드가 강제하는** 오케스트레이터입니다.
접수함 검증·패키지 생성 → 외부 자료 조사 → 글 작성 → LLM-as-judge 정량평가(코드 판정) →
형식 검토 → 발행 준비(draft)까지 자동으로 진행하고, **실제 발행은 절대 하지 않습니다** —
사람이 보고서와 draft를 확인한 뒤 직접 발행합니다.

## 2. 주요 기능

- **6단계 파이프라인**: ①접수(`prpub scan/build`) ②정보수집(리서처) ③글 작성(라이터)
  ④LLM-as-judge 정량평가 ⑤형식 검토(리뷰어) ⑥발행 준비(draft까지만)
- **판정은 코드가**: LLM은 항목별 점수·근거(JSON)만 내고, 통과선(12/14)·거부권(대체 불가능성
  0점)·차단 검사·제목 심사 판정은 오케스트레이터 코드가 수행
- **깎인 항목만 재작성**: 실패 항목을 타깃으로 지정해 외과적 재작성 루프
  (상한·정체 감지: 점수 2회 연속 미상승 시 중단·보고)
- **5.5 최종 재판정**: 형식 검토의 재작성이 점수를 회귀시켰는지 judge가 한 번 더 확인.
  불통과 시 사이클 재진입(상한 `pipeline.max_cycles`)
- **중단 후 재개**: 단계별 상태를 `state/<slug>.json`에 저장 — 크래시·Ctrl+C 후 재실행하면
  이어서 진행. 완주한 건은 품질 게이트로 재평가를 건너뜀
- **동시 실행 방지**: O_EXCL lock + heartbeat + stale 회수
- **실행 보고서**: 건별 점수표·루프 이력·draft 결과·스킵 사유를 `output/`에 md로 생성
- **발행 안전핀**: `--publish`/`--live` 플래그가 섞이면 즉시 중단 (assert가 아니라 명시적 검사)

## 3. 요구사항

| 항목 | 내용 |
|---|---|
| Python | 3.11 이상 |
| uv | 필수 (이 프로젝트와 pr-publish 둘 다 uv로 실행) |
| claude CLI | 필수 — `claude -p` 호출 가능해야 함 (버전 2.x에서 검증) |
| pr-publish | `daeasy-pr-publish` 프로젝트가 로컬에 있어야 함 (`config.yaml`의 `prpub.root`) |
| API 키 | 기본적으로 불필요 — claude CLI 로그인 세션 사용. API 키 방식이면 `ANTHROPIC_API_KEY` |
| (선택) 검색 API 키 | pr-publish의 `.secrets.toml`에 네이버/카카오 검색 키가 있으면 조사 범위가 넓어짐 |

## 4. 설치 방법

이 파이프라인은 `ai-service` 의 uv 가상환경을 그대로 씁니다 (별도 venv 없음). 의존성은
`pyyaml` · `python-dotenv` 뿐이라 `ai-service/pyproject.toml` 에 이미 포함돼 있습니다.

```powershell
cd C:\dev\kbrain\daeasy\ai-service
uv sync

# claude CLI 확인 (없으면 https://claude.com/claude-code 참고)
claude --version

# pr-publish 쪽 의존성은 그 프로젝트에서 uv sync 되어 있어야 한다
cd C:\Users\케이브레인\project\daeasy-pr-publish
uv sync
```

## 5. 환경 설정 (.env)

별도 `.env` 가 없습니다. `ai-service/.env` 를 읽되, `insights` 파이프라인과 같은 규약으로
`ANTHROPIC_API_KEY` 는 **실행 시 의도적으로 제거**합니다 — claude CLI 로그인 세션(Anthropic 구독)을
쓰기 위해서입니다. `claude` 를 한 번 실행해 로그인이 돼 있으면 별도 키가 필요 없습니다.

## 6. config.yaml 설정

| 키 | 기본값 | 설명 |
|---|---|---|
| `prpub.root` | (필수) | pr-publish 프로젝트 루트 절대경로. `config.toml`이 있어야 함 |
| `prpub.scan_timeout_sec` | 120 | `prpub scan --json` 타임아웃(초) |
| `prpub.build_timeout_sec` | 300 | `prpub build` 타임아웃 |
| `prpub.score_timeout_sec` | 120 | `scripts/score.py` 타임아웃 |
| `prpub.site_timeout_sec` | 600 | `prpub site` 타임아웃 |
| `prpub.naver_timeout_sec` | 1500 | `prpub naver` 타임아웃 — 무발행 모드는 10분 대기 후 스스로 종료하므로 그보다 길게 |
| `prpub.naver_profile_dir` | `.naver-profile` | 네이버 세션 판정 폴더 (prpub.root 기준) |
| `prpub.site_session_file` | `.daeasy-session.json` | 사이트 세션 판정 파일 |
| `claude.cmd` | `claude` | claude CLI 실행 파일 |
| `claude.model` | `sonnet` | `--model` 값 (`sonnet`/`opus` 별칭 또는 전체 모델명) |
| `claude.timeout_sec` | 900 | 호출 1회 타임아웃 |
| `claude.retries` | 3 | 호출 재시도(총 시도 횟수) |
| `claude.retry_wait_sec` | 10 | 재시도 사이 대기 |
| `claude.reformat_retries` | 1 | JSON 파싱 실패 시 형식 재요청 횟수 |
| `claude.extra_args` | `["--no-session-persistence"]` | 모든 호출 공통 인자 |
| `claude.roles.<역할>.allowed_tools` | 역할별 | `--allowedTools` 목록. 예: `Bash(uv run python scripts/search_kr.py:*)` |
| `claude.roles.<역할>.disallowed_tools` | 역할별 | `--disallowedTools` 목록. judge/reviewer는 Read·Grep·Glob까지 봉쇄 |
| `claude.roles.researcher.web_domains` | 기관 도메인 | `WebFetch(domain:…)` 허용 도메인 (네이버 계열 금지) |
| `judge.max_rounds` | 5 | judge 루프 상한 |
| `judge.pass_score` | 12 | 14점 만점 통과선 |
| `judge.stall_rounds` | 2 | 총점이 이 횟수 연속 오르지 않으면 정체 중단 |
| `judge.search_item4_full` / `_half` | 4.0 / 2.5 | 검색 노출 → 항목4 환산 경계 |
| `review.max_rounds` | 5 | review 루프 상한 |
| `review.stall_rounds` | 2 | FAIL 건수 정체 판정 |
| `pipeline.max_cycles` | 2 | 5.5 불통과 시 재사이클 상한 (초과 시 stalled_regression) |
| `lock.path` | `state/pipeline.lock` | lock 파일 경로 |
| `lock.stale_after_sec` | 600 | heartbeat가 이만큼 끊기면 stale 회수 |
| `lock.heartbeat_sec` | 60 | 실행 중 mtime 갱신 주기 |
| `lock.acquire_retries` | 2 | lock 재획득 시도 횟수 |
| `paths.state_dir` 등 | `state`/`logs`/`output`/`prompts` | 프로젝트 내부 경로 |

## 7. 실행 방법

모든 명령은 `ai-service/` 디렉토리에서 실행합니다. daeasy 저장소의 `/review-publish` 슬래시 명령이 이 실행을 감쌉니다.

```powershell
cd C:\dev\kbrain\daeasy\ai-service

# 전체 접수 건 처리
uv run python promo/run.py

# 특정 건만 처리 (scan·인덱스 최신화는 전체 수행)
uv run python promo/run.py --slug 2026-08-25_부산시_AI-챔피언-그린

# 다른 설정 파일로 실행 (상대 경로는 promo/ 기준)
uv run python promo/run.py --config tests/config.검증.yaml

# 한 건의 상태를 지우고 처음부터 (경고·확인 후 state와 인덱스 항목만 삭제)
uv run python promo/run.py --reset 2026-08-25_부산시_AI-챔피언-그린
# 비대화형(스크립트)에서 reset — 확인 프롬프트 생략
uv run python promo/run.py --reset <slug> --yes
```

| 인자 | 설명 |
|---|---|
| `--config <path>` | config.yaml 경로 (기본: `promo/config.yaml`. 상대 경로는 `promo/` 기준) |
| `--slug <slug>` | 해당 건만 처리. 매칭 0건이면 exit 1 |
| `--reset <slug>` | state·인덱스 항목 삭제 후 종료(파이프라인 미실행). 다음 실행 시 build부터 재시작되며 `out/<slug>/`가 삭제·재생성됨 |
| `--yes` | `--reset` 확인 프롬프트 생략. 단독 지정 시 경고 후 무시 |

동작 메모:
- `--slug`와 `--reset`은 동시 지정 불가.
- 이미 다른 실행이 돌고 있으면 lock 때문에 거부됩니다(exit 1). 이전 실행이 죽어 lock만
  남았다면 10분(stale) 뒤 자동 회수됩니다.
- Ctrl+C로 끊어도 lock은 해제되며, 재실행하면 이어서 진행합니다.
- 네이버/사이트 로그인 세션이 없으면 6단계 해당 채널은 skipped로 기록되고, pr-publish에서
  `uv run prpub naver-login` / `uv run prpub site-login` 후 재실행하면 그 채널만 재시도합니다.
- **실제 발행은 이 도구가 하지 않습니다.** 확인 후 pr-publish에서
  `uv run prpub naver <slug> --publish` / `uv run prpub site <slug> --live`를 직접 실행하세요.

## 8. 출력 결과

| 위치 (`ai-service/promo/` 기준, 모두 git 제외) | 내용 |
|---|---|
| `output/실행보고서_YYYY-MM-DD_HHMMSS.md` | 실행 보고서 (아래 예시) |
| `logs/YYYYMMDD.log` | 단계·루프 횟수·점수 변화 로그 |
| `state/<slug>.json` | 건별 진행 상태(재개용): 단계 상태·해시 대장·사이클·채점 이력·draft 결과 |
| `state/_index.json` | slug ↔ 접수 폴더 매핑·검증 실패 사유 |
| (pr-publish) `out/<slug>/` | `brief.md`·`research.md`·`insight.md`·`photos.md`·`post.md`·`naver.md`·`naver_미리보기*.png` |

실행 보고서 예시(요약):

```markdown
# 홍보발행 파이프라인 실행 보고서
- 실행 시각: 2026-09-03 21:12:40
- 처리 대상: 1건 · 접수 제외: 1건

## 접수 제외 건 (등록자 수정 요청)
- **2026-08-25_부산시_그린5회차_오류** — 항목 비어 있음: 교육기관; 교육 일자 형식 오류
  - 전달 문구: "… 보완해 다시 넣어 주세요: …"

## 건별 결과
### 2026-08-25_부산시_AI-챔피언-그린
| 단계 | 상태 | 상세 |
|---|---|---|
| intake | 완료 | build 완료: … |
| judge | 완료 | 사이클1 라운드2 통과 (13/14) |
…
#### 채점 이력 (judge 루프 · 5.5 최종 재판정)
| 구분 | 사이클 | 라운드 | 총점 | 항목별 (1~7) | 제목 | 차단 |
| judge | 1 | 1 | 10/14 | 1:1 2:2 3:1 … | 불통과 | 1건 |
…
- **daeasy 사이트**: 스킵(세션 없음)
  - 로그인 세션 없음 — `uv run prpub site-login` 후 재실행하면 재시도됩니다
```

## 9. 에러 대처법

**① `다른 실행이 진행 중입니다 (lock)`**
- 실제 다른 실행이 돌고 있으면 기다립니다. 이전 실행이 강제 종료(작업관리자 kill 등)돼
  lock만 남은 경우, heartbeat가 끊긴 지 `lock.stale_after_sec`(기본 600초)이 지나면
  다음 실행이 자동 회수합니다. 급하면 `state/pipeline.lock` 파일을 직접 지워도 되지만,
  **다른 실행이 정말 없는지 먼저 확인**하세요.

**② `claude 호출이 3회 모두 실패` (FatalClaudeError)**
- `claude --version`으로 CLI가 살아 있는지, `claude` 단독 실행으로 로그인이 유효한지
  확인합니다. 네트워크·요금 한도 문제일 수도 있습니다. 해결 후 재실행하면 완료된
  단계는 건너뛰고 이어서 진행합니다.

**③ `judge 루프 상한 도달` / `점수 정체` / `stalled_regression`**
- 오류가 아니라 설계된 중단입니다. 보고서의 항목별 점수 이력을 보고 무엇이 부족한지
  확인하세요. 재료 부족(항목3)이면 등록자에게 양식 보완을 요청하는 것이 맞고, 억지로
  통과시키지 않습니다. 본문을 직접 고쳤다면 그냥 재실행 — 수동 편집을 감지해 judge부터
  다시 잽니다.

**④ 6단계에서 `skipped(세션 없음)`**
- pr-publish에서 `uv run prpub naver-login` 또는 `uv run prpub site-login`으로 로그인한 뒤
  재실행하면 그 채널만 재시도합니다.

**⑤ `수동 확인 대기(기존 draft가 구버전)` (already_exists_stale)**
- 사이트에 같은 slug의 draft가 이미 있는데 본문이 그 사이 바뀐 경우입니다.
  어드민(<https://daeasy.co.kr/admin/cases>)에서 기존 draft를 삭제하고 재실행하면
  자동으로 최신본 draft가 올라갑니다. 삭제하지 않고 재실행하면 같은 경고가 반복될 뿐
  다른 부작용은 없습니다.

**⑥ `--slug … 에 매칭되는 접수 건이 없습니다`**
- slug는 `날짜_기관_과정` 형태로 접수 폴더에서 계산됩니다. `state/_index.json`에서
  현재 인식된 slug 목록을 확인하세요.

**⑦ 한글이 콘솔에서 깨질 때**
- 로그 파일(`logs/`)은 UTF-8로 항상 정상 기록됩니다. PowerShell에서
  `chcp 65001` 후 실행하면 콘솔 출력도 정상화됩니다.

## 10. 라이선스

내부 도구 — (주)케이브레인컴퍼니 내부 사용 목적. 외부 배포·재사용 시 별도 협의.
