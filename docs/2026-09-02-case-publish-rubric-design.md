# 교육후기 발행 슬래시 명령어 — 평가 루브릭 설계 (논문 기반)

> `/case-publish` (가칭) 의 Evaluator 가 쓸 지표 정리. 인사이트 파이프라인의
> `evaluator/rubric.yaml` (7개 기준, 가중평균 4.0/5.0 통과, Writer 최대 3회 재실행)
> 구조를 그대로 따르되, "뉴스 큐레이션"이 아닌 "후기(testimonial)" 장르에 맞게
> 기준을 교체한다.

## 1. 이론적 근거 — 왜 이 기준들인가

### 글 품질 (텍스트 평가 연구)

- **G-Eval / SummEval 4대 차원** (Liu et al., EMNLP 2023; Fabbri et al., 2021):
  LLM-as-judge 평가에서 인간 판단과 상관이 검증된 표준 차원 —
  **coherence(구성·흐름) / consistency(사실 일치) / fluency(문장 품질) /
  relevance(핵심 내용 선별)**. UniEval (Zhong et al., 2022) 도 같은
  다차원 프레임을 쓴다. → 루브릭의 뼈대.
- **온라인 후기 유용성(helpfulness) 메타분석** (Hong et al., 2017, Decision
  Support Systems; Springer Electronic Commerce Research 2019 메타분석):
  후기의 유용성을 올리는 요인은 **구체성·깊이(review depth)**,
  **작성자 신원·전문성 공개**, **멀티미디어(사진)**. 길이는 정비례가 아니라
  적정 구간이 있고(너무 길면 역효과), readability 는 연구 간 결과가 갈린다
  → 길이·가독성은 감점 방지선으로만 쓰고 핵심 배점은 구체성에 준다.
- **서사 전이 이론(Narrative Transportation)** (Green & Brock, 2000; Thomas &
  Grigsby, 2024 체계적 문헌고찰): 인물·장면이 있는 이야기는 반박 심리를
  낮추고 태도 변화를 만든다. 후기는 광고가 아니라 이야기일 때 설득한다
  → "현장 서사" 기준.

### SEO (검색 최적화 연구)

- **랭킹 요인 실증 연구**: MDPI Future Internet (2019) "Important Factors for
  Improving Google Search Rank", ACM WebSci 2021 "The influence of SEO on
  Google's results" — 문헌에서 반복 확인되는 on-page 요인은 **title 태그 내
  키워드, 메타 태그, 헤딩 구조, 내부 링크, 로딩 속도**. MCDM 연구
  (Springer AIR 2019) 에서도 meta tags > keywords > 구조 순.
  단, 상관≠인과라는 한계가 문헌에 명시돼 있다 → 체크리스트로 쓰되
  키워드 밀도 같은 미신적 수치 목표는 두지 않는다.
- **Google E-E-A-T** (Search Quality Rater Guidelines, 2022~): Experience /
  Expertise / Authoritativeness / **Trust(최상위)**. 직접 랭킹 요인이 아니라
  평가자 가이드라인이지만, 후기 콘텐츠는 장르 자체가 **Experience(직접 경험)**
  신호라서 이 프레임과 정확히 맞는다. "실제로 했다"는 증거(날짜·장소·인원·
  산출물·사진)가 곧 SEO 자산.

## 2. 루브릭 제안 (rubric.yaml 형식, 가중치 합 1.0)

| # | 기준 | 가중치 | 무엇을 보나 | 근거 |
|---|------|--------|-------------|------|
| 1 | `factual_grounding` | 0.20 | 입력 자료(교육 개요·만족도·산출물)와 본문 사실 일치. 과장·지어낸 인용 0건. 확정 실적과 추정의 구분 | G-Eval consistency, E-E-A-T Trust("가장 중요") |
| 2 | `experience_signal` | 0.15 | 현장에 있던 사람만 쓸 수 있는 디테일 — 시간대, 강의실 장면, 참가자 반응, 실습 중 사건. 보도자료 문체면 감점 | E-E-A-T Experience, Green & Brock 서사 전이 |
| 3 | `specificity` | 0.15 | 구체 수치·커리큘럼·산출물·실명 기관(동의 범위 내)·인용문. "유익한 시간이었다" 류 일반론 비중이 높으면 감점 | 후기 유용성 메타분석 (review depth 양(+) 효과) |
| 4 | `coherence` | 0.10 | 도입(맥락) → 전개(무엇을 했나) → 성과 → 마무리 흐름. 문단 간 논리 연결 | G-Eval/SummEval coherence |
| 5 | `human_voice` | 0.15 | AI 상투어("~하는 시간을 가졌습니다" 반복, "혁신적인" 남발) 없음. 자연스러운 한국어, 인사이트 rubric 의 human_voice 와 동일 취지 | G-Eval fluency + 기존 파이프라인 검증된 기준 재사용 |
| 6 | `seo_onpage` | 0.15 | 제목에 핵심 키워드(기관명·과정명) 전방 배치 + 55자 내외, summary(=meta description 역할) 70~110자에 검색 의도 반영, h2 헤딩 구조, 본문에 관련 과정 내부 링크 1개 이상 | MDPI 2019, ACM 2021, MCDM 2019 |
| 7 | `image_relevance` | 0.10 | 본문 이미지가 해당 단락 내용과 일치, 항목 수만큼 존재, alt 텍스트 서술형 | 후기 유용성 연구 (멀티미디어 양(+) 효과), 인사이트 rubric image_relevance 대응 |

통과선: 가중평균 **4.0 / 5.0** (인사이트와 동일). `seo_onpage` 또는
`image_relevance` 만 미달이면 해당 단계만 재실행 (인사이트의
image-only retry 패턴 재사용).

## 3. LLM 평가에 맡기면 안 되는 것 — 결정적(pre-flight) 체크

점수가 아니라 통과/차단으로 코드에서 검사한다 (LLM 은 세는 일에 약하다):

- **개인정보**: 참가자 실명 + 소속 조합 검출 시 차단 (2026-09-02 draft 8건에서
  실명 7명 발견해 익명화한 전례). 강사·대표 등 공개 동의된 이름은 화이트리스트
- **제목 길이** ≤ 60자, **summary 길이** 70~120자 (SERP 잘림 방지)
- **thumbnail_url 존재** + 참조 이미지 파일 실재
- **금지 표현**: 비공개 실적 수치(인증·수료 인원), 생성 시점을 속이는 카피
- **slug 중복** 검사

## 4. 구현 메모

- 파이프라인 뼈대는 인사이트와 동일: 입력(교육 메모·사진) → Writer(claude CLI)
  → Proofreader → Evaluator(codex CLI) → `cases` 테이블 INSERT (`status='draft'`
  로 넣고 어드민 검수 후 발행 권장 — 후기는 고객사 실명이 걸려 있어
  인사이트보다 검수 필요성이 높다)
- Review 구조화 데이터(schema.org `Review`) JSON-LD 는 frontend 쪽 후속 작업으로 분리

## 참고 문헌

- Liu et al., *G-Eval: NLG Evaluation using GPT-4* (EMNLP 2023) — arxiv.org/abs/2303.16634
- Fabbri et al., *SummEval* (TACL 2021)
- Zhong et al., *Towards a Unified Multi-Dimensional Evaluator for Text Generation* (UniEval, EMNLP 2022) — arxiv.org/abs/2210.07197
- Hong, Xu, Wang & Fan, *Understanding the determinants of online review helpfulness: A meta-analytic investigation* (Decision Support Systems, 2017)
- *What makes a helpful online review? A meta-analysis of review characteristics* (Electronic Commerce Research, 2019)
- Green & Brock, *The Role of Transportation in the Persuasiveness of Public Narratives* (JPSP, 2000)
- Thomas & Grigsby, *Narrative transportation: A systematic literature review* (Psychology & Marketing, 2024)
- Matoševic et al., *Important Factors for Improving Google Search Rank* (Future Internet, MDPI, 2019)
- Lewandowski et al., *The influence of search engine optimization on Google's results* (ACM WebSci, 2021)
- *Improving SEO by using hybrid modified MCDM models* (Artificial Intelligence Review, Springer, 2019)
- Google, *Search Quality Rater Guidelines* — E-E-A-T (2022 개정)
