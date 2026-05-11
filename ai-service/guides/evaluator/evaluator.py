import json
import subprocess
from pathlib import Path

import yaml


def load_rubric() -> dict:
    with open(Path(__file__).parent / "rubric.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def evaluate(guide: dict) -> tuple[float, bool, str]:
    rubric = load_rubric()
    threshold = rubric.get("pass_threshold", 4.0)

    criteria_text = "\n".join(
        f"- **{c['name']}** (가중치 {c['weight']}, 최대 {c['max_score']}점): {c['description']}"
        for c in rubric["criteria"]
    )

    prompt = f"""다음 AI·데이터 가이드 문서를 아래 루브릭 기준으로 평가해주세요.

## 평가 루브릭
{criteria_text}

## 가이드 문서
제목: {guide['title']}
카테고리: {guide['category']}
요약: {guide['summary']}

TL;DR:
{chr(10).join(f'- {t}' for t in guide.get('tldr', []))}

본문:
{guide['body']}

## 응답 형식 (JSON만 출력)
{{
  "scores": {{
    "accuracy": 0~5,
    "practical_relevance": 0~5,
    "user_friendliness": 0~5,
    "structure": 0~5,
    "korean_naturalness": 0~5
  }},
  "weighted_score": 0~5,
  "pass": true/false,
  "feedback": "개선이 필요한 부분 설명. AI 상투어 발견 시 구체적 문장 지목.",
  "strengths": "잘 된 부분"
}}"""

    import os
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    import shutil
    codex_cmd = shutil.which("codex") or "codex"
    result = subprocess.run(
        [codex_cmd, "exec", "--skip-git-repo-check", "-s", "read-only", "-"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=240,
        env=env,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise RuntimeError(f"codex CLI 실패: {result.stderr}")
    output = result.stdout
    start = output.find("{")
    end = output.rfind("}") + 1
    if start == -1:
        raise ValueError("JSON을 찾을 수 없음")

    data = json.loads(output[start:end])
    score = data.get("weighted_score", 0)
    passed = data.get("pass", False) and score >= threshold

    return score, passed, data.get("feedback", "")
