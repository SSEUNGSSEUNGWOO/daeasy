import json
import re
import subprocess


TEMPLATE_GUIDE = """
가이드 템플릿 구조:
1. tldr: 핵심 요약 3개 (짧고 명확한 문장)
2. body 첫 섹션: ## 개요 또는 개념 설명
3. body 중간: ## 작동 방식 또는 핵심 원리
4. body 하단: ## 비즈니스/실무 활용 방법 (활용 예시 포함, 일반 기업·공공기관·AI 전환 조직 어디든 OK)
5. 콜아웃 박스 활용:
   - > 💡 **팁**: 실용적인 조언
   - > ⚠️ **주의**: 유의사항
   - > 📌 **핵심**: 반드시 기억할 내용
6. 오탈자, 비자연스러운 표현 교정
7. AI 상투어 제거: '살펴보겠습니다', '알아보겠습니다', '중요한 시사점' 등
"""


def edit(guide: dict) -> dict:
    prompt = f"""다음 가이드 문서를 편집해주세요.

{TEMPLATE_GUIDE}

## 편집 대상

제목: {guide['title']}
카테고리: {guide['category']}
요약: {guide['summary']}
난이도: {guide.get('difficulty', '기초')}

현재 TL;DR:
{chr(10).join(f'- {t}' for t in guide.get('tldr', []))}

현재 본문:
{guide['body']}

## 편집 지침
- 템플릿 구조에 맞게 섹션 재구성 (내용은 최대한 유지)
- TL;DR이 없거나 부실하면 본문에서 핵심 3개 추출해 보완
- 콜아웃 박스를 본문에 2~3개 자연스럽게 삽입
- 오탈자 및 어색한 표현 교정
- AI 상투어 자연스럽게 수정
- 전체 분량은 줄이지 말 것

## 응답 형식 (아래 구분자를 정확히 지켜 출력)

===TLDR===
핵심1
핵심2
핵심3
===BODY===
편집된 마크다운 본문 전체
===END==="""

    import os
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    result = subprocess.run(
        ["claude", "-p", "-"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=180,
        env=env,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise RuntimeError(f"claude CLI 실패: {result.stderr}")
    output = result.stdout

    tldr_match = re.search(r"===TLDR===\n(.*?)\n===BODY===", output, re.DOTALL)
    body_match = re.search(r"===BODY===\n(.*?)(?:\n===END===|$)", output, re.DOTALL)

    if tldr_match:
        tldr_lines = [l.lstrip("-• ").strip() for l in tldr_match.group(1).strip().splitlines() if l.strip()]
        guide["tldr"] = tldr_lines[:3]
    if body_match:
        guide["body"] = body_match.group(1).strip()
    return guide
