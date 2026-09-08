import json
import re
import subprocess
import urllib.error
import urllib.request
import yaml
from pathlib import Path

from shared.storage import load_draft, save_draft

# 심사위원 고정. -m 을 주지 않으면 codex CLI 기본 모델을 따라가는데, 그러면 통과선 4.0 의
# 의미가 CLI 업데이트마다 조용히 달라진다 (2026-09-07 기본값이 gpt-6-astra 로 바뀌면서
# 같은 품질의 글이 3.4~3.8 로 떨어져 발행이 멈췄다). 모델을 바꿀 때는 과거 통과 글을
# 재채점해 pass_threshold 를 다시 뽑을 것.
EVAL_MODEL = "gpt-5.6-sol"


def load_rubric() -> dict:
    with open(Path(__file__).parent / "rubric.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def check_urls(draft: str) -> list[str]:
    urls = re.findall(r'\[([^\]]+)\]\((https?://[^\)]+)\)', draft)
    invalid = []
    for _, url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status == 404:
                    invalid.append(url)
        except urllib.error.HTTPError as e:
            if e.code in (401, 404):
                invalid.append(url)
        except Exception:
            pass
    return invalid


def evaluate_with_codex_cli(draft: str, rubric: dict, image_meta: dict | None = None) -> dict:
    import os

    criteria_text = "\n".join(
        f"- **{c['name']}** (가중치 {c['weight']}, 최대 {c['max_score']}점): {c['description']}"
        for c in rubric["criteria"]
    )

    image_section = ""
    if image_meta:
        cover_query = image_meta.get("cover_query") or "(없음)"
        cover_url = image_meta.get("cover_image") or "(없음)"
        image_section = f"""

## 이미지 메타데이터 (image_relevance 평가용)
- 커버 이미지 검색 키워드 (Claude가 헤드라인에서 추출): `{cover_query}`
- 커버 이미지 URL: `{cover_url}`
"""

    prompt = f"""다음 AI 인사이트 리포트를 아래 루브릭 기준으로 평가해주세요.

## 평가 루브릭
{criteria_text}

## 리포트
{draft}
{image_section}
## 응답 형식 (JSON만 출력)
{{
  "scores": {{
    "factual_accuracy": 0~5,
    "relevance": 0~5,
    "insight_quality": 0~5,
    "source_linkage": 0~5,
    "seo_quality": 0~5,
    "human_voice": 0~5,
    "image_relevance": 0~5
  }},
  "feedback": "개선이 필요한 부분 설명 (AI 상투어·이미지 부적합 시 구체적 사유)",
  "strengths": "잘 된 부분"
}}"""

    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    import shutil
    codex_cmd = shutil.which("codex") or "codex"
    result = subprocess.run(
        [codex_cmd, "exec", "--skip-git-repo-check", "-s", "read-only", "-m", EVAL_MODEL, "-"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=240,
        env=env,
        encoding="utf-8",
        shell=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"codex CLI 실패: {result.stderr}")

    output = result.stdout
    start = output.find("{")
    end = output.rfind("}") + 1
    if start == -1:
        raise ValueError("codex CLI 응답에서 JSON을 찾을 수 없음")

    return json.loads(output[start:end])


def _load_image_meta() -> dict:
    from shared.storage import load_draft_meta
    meta = load_draft_meta()
    return {
        "cover_query": meta.get("cover_query"),
        "cover_image": meta.get("cover_image"),
    }


def _strip_section_images(draft: str) -> str:
    """image-only retry 직전 본문 내 누적된 source-image를 제거한다."""
    return re.sub(r'!\[source-image\]\([^)]+\)\n\n', '', draft)


def run() -> tuple[bool, dict]:
    rubric = load_rubric()
    draft = load_draft()

    if not draft:
        print("[evaluator] draft 없음")
        return False, {}

    max_retries = rubric.get("max_retries", 3)
    threshold = rubric.get("pass_threshold", 3.5)

    text_keys = ["factual_accuracy", "relevance", "insight_quality",
                 "source_linkage", "seo_quality", "human_voice"]

    image_section_skip = 0  # image-only retry마다 +1 — 다른 출처의 og:image 시도

    for attempt in range(1, max_retries + 1):
        print(f"[evaluator] 평가 시도 {attempt}/{max_retries}")

        invalid_urls = check_urls(draft)
        if invalid_urls:
            print(f"[evaluator] 유효하지 않은 URL {len(invalid_urls)}개: {invalid_urls}")

        image_meta = _load_image_meta()
        try:
            result = evaluate_with_codex_cli(draft, rubric, image_meta=image_meta)
        except Exception as e:
            print(f"[evaluator] 평가 실패: {e}")
            return False, {}

        scores = result.get("scores", {})
        # 가중평균·합격 판정은 코드가 한다. LLM 산수를 믿지 않고, 통과선을 프롬프트에 알릴 필요도 없다
        score = round(sum(scores.get(c["name"], 0) * c["weight"] for c in rubric["criteria"]), 4)
        result["weighted_score"] = score  # run.py 가 evaluation_score 로 저장
        passed = score >= threshold and not invalid_urls

        print(f"[evaluator] 점수: {score:.2f} / 통과: {passed}")
        print(f"[evaluator] 피드백: {result.get('feedback', '')}")

        if passed:
            return True, result

        if attempt < max_retries:
            query_feedback = f"이전 검색어 '{image_meta.get('cover_query')}' 평가: {result.get('feedback', '')}"
            image_score = scores.get("image_relevance", 5)
            text_avg = sum(scores.get(k, 0) for k in text_keys) / len(text_keys)

            from image_agent.image_agent import run as image_agent_run
            from shared.storage import load_raw_items, save_draft as _save_draft

            # 이미지만 부족하고 텍스트는 OK → image_agent만 재실행 (다른 출처 + 피드백 반영한 새 검색어)
            if not invalid_urls and image_score < threshold and text_avg >= threshold:
                image_section_skip += 1
                print(f"[evaluator] image-only 재시도 (image={image_score}, 텍스트 평균={text_avg:.2f}, 출처 {image_section_skip}개 skip)")
                items = load_raw_items(today_only=True)
                cleaned = _strip_section_images(draft)
                new_draft, cover_image, cover_query = image_agent_run(
                    cleaned, items, section_skip=image_section_skip, query_feedback=query_feedback
                )
                _save_draft(new_draft, cover_image=cover_image, cover_query=cover_query)
                draft = new_draft
                continue

            # 텍스트 문제 → Writer + image_agent 전체 재실행 (기존 동작) — 새 draft니 skip 카운터 리셋
            image_section_skip = 0
            feedback = result.get("feedback", "")
            if invalid_urls:
                feedback += f"\n\n다음 URL은 실제로 접근 불가능하므로 반드시 수집 데이터에 있는 실제 URL로 교체하세요: {', '.join(invalid_urls)}"
            print("[evaluator] 피드백과 함께 재작성 요청...")
            from writer.writer import run as writer_run
            new_draft = writer_run(feedback=feedback)
            if not new_draft:
                return False, result
            items = load_raw_items(today_only=True)
            new_draft, cover_image, cover_query = image_agent_run(new_draft, items, query_feedback=query_feedback)
            from proofreader.proofreader import run_safe as proofread
            new_draft = proofread(new_draft)  # 본 실행과 같은 순서 — 재작성 글만 교정 없이 평가받지 않도록
            _save_draft(new_draft, cover_image=cover_image, cover_query=cover_query)
            draft = new_draft

    return False, result
