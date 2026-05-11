import subprocess


PROMPT_TEMPLATE = """다음은 AI 동향 리포트 마크다운 초안입니다. 아래 항목만 수정하고 수정된 전체 텍스트를 그대로 반환하세요.

수정 항목:
- 오타 교정
- 갑자기 삽입된 한자(漢字)를 자연스러운 한국어로 교체
- 문장 부호 오류 (예: 마침표 누락, 따옴표 불일치)
- 어색한 띄어쓰기
- 마크다운 구조 교정: 번호 항목(1. 2. 3. ...) 안의 **에디터 코멘트:** 와 출처 링크([출처명](URL))가 들여쓰기(3칸 공백) 없이 줄 시작에 있으면 반드시 3칸 공백을 앞에 추가해 번호 항목 본문에 포함되도록 수정

절대 하지 말 것:
- 내용 변경, 요약, 재작성
- 이미지(![...](...)와 링크([...](...)의 URL 수정
- 문장 추가 또는 삭제
- HTML 주석(`<!-- ... -->`) 제거·이동·수정 — 메타데이터이므로 위치와 내용을 그대로 유지
- 수정 내역 설명, 변경 사항 목록, 안내 문구 출력 — 오직 수정된 텍스트만 출력

---

{draft}
"""


def run(draft: str) -> str:
    prompt = PROMPT_TEMPLATE.format(draft=draft)
    import os
    import shutil
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    claude_cmd = shutil.which("claude") or "claude"
    result = subprocess.run(
        [claude_cmd, "-p", "-"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=300,
        env=env,
        encoding="utf-8",
        shell=True,
    )
    if result.returncode != 0:
        print(f"[proofreader] CLI 실패, 원본 유지: {result.stderr[:100]}")
        return draft
    corrected = result.stdout.strip()
    if not corrected:
        return draft
    # 설명 텍스트가 앞에 붙은 경우 # 이전 내용 제거
    if "#" in corrected:
        corrected = corrected[corrected.index("#"):]
    print("[proofreader] 교정 완료")
    return corrected
