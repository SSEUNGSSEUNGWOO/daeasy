# 인사이트 → 네이버 블로그 티저 초안 — 구현 기록

작성: 2026-09-09 · 설계: [2026-09-09-insight-naver-teaser-design.md](2026-09-09-insight-naver-teaser-design.md)

## 구현

| 파일 | 내용 |
|---|---|
| `ai-service/insights/naver_teaser.py` | `prpub_root()` (env → promo config), `items(body)` (번호 항목 → 소제목·첫 문장), `build_naver_md()`, `draft(insight)` — naver.md·images/cover.jpg 를 `<PRPUB_ROOT>/out/<slug>/` 에 쓰고 `uv run prpub naver <slug>` 실행. 타임아웃이어도 `naver_미리보기1.png` 가 있으면 성공으로 본다 (promo F6 과 동일) |
| `ai-service/insights/run.py` | `save_to_insights()` 끝, 뉴스레터 다음에 `naver_draft(insight)` (try/except) |

## 로그 읽는 법

| 출력 | 뜻 |
|---|---|
| `[naver] pr-publish 없음 …` | 이 PC 에 pr-publish 가 없다. `PRPUB_ROOT` 설정 후 재실행 |
| `[naver] 네이버 세션 없음 …` | pr-publish 에서 `uv run prpub naver-login` |
| `[naver] 에디터에 채워둠 — 블로그에서 확인 후 발행` | 정상. 블로그 글쓰기 화면에 채워져 있다 — **발행 버튼은 승우님이** |
| `[naver] prpub naver 실패: …` | pr-publish 에서 `uv run prpub naver <slug>` 를 직접 돌려 원인 확인 |

## 첫 실행 전 (pr-publish 가 있는 PC)

1. `PRPUB_ROOT` 환경변수 (promo config 의 `prpub.root` 와 같은 값이면 생략 가능)
2. `uv run prpub naver-login` 한 번
3. 블로그에 카테고리 **AI 인사이트** 가 있는지 — 없으면 만들거나 `NAVER_INSIGHT_CATEGORY` 로 바꾼다
4. `/insight-publish` 실행 → `[naver] 에디터에 채워둠` 확인 → 블로그에서 미리보기 후 발행

## 미검증 (첫 실행에서 확인)

- `prpub naver` 가 `naver.md` 외에 `meta.json`·`brief.md` 를 요구하는지 — 요구하면 최소 파일을 같이 만든다
- naver.md 본문의 평문 문단·URL 한 줄이 에디터에서 의도대로 들어가는지 (규격 원문은 pr-publish 의 `홍보발행.md` 5절)
- percent-encoded 한글 URL 이 에디터에서 링크로 잡히는지 — 안 잡히면 raw 한글 URL 로 바꾼다
