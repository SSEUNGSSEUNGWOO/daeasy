"""public-ax.vercel.app/guide/<slug> 한 건을 fetch → claude CLI 로 공공기관 → 일반 조직 어조 재작성 → supabase guides 에 draft 로 저장.

usage:
    cd ai-service
    uv run python scripts/import_public_ax_guide.py vibe-coding-for-public-sector

승인 후 published 로 전환은 사용자가 Supabase Studio 에서 수동.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv(Path(__file__).parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

BASE = "https://public-ax.vercel.app/guide/{slug}"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

OUT = Path(__file__).parent / "_poc_out"
OUT.mkdir(exist_ok=True)


def fetch_raw(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def extract_meta(html: str, prop: str) -> str | None:
    m = re.search(
        rf'<meta[^>]*property="{re.escape(prop)}"[^>]*content="([^"]*)"',
        html, re.I,
    )
    return m.group(1) if m else None


def extract_markdown(html: str) -> str:
    """__next_f.push([1, "..."]) 안의 escape 된 markdown 본문 추출.
    본문 시작 = '## 개요' 이전부터의 가장 가까운 push payload, 끝 = 그 payload 의 string 종료.
    """
    idx = html.find("## 개요")
    if idx < 0:
        raise ValueError("'## 개요' marker not found")

    # 시작 위치에서 가장 가까운 앞 `__next_f.push([1,"` 찾기
    push_start = html.rfind('__next_f.push([1,"', 0, idx)
    if push_start < 0:
        raise ValueError("push payload not found before marker")
    str_start = push_start + len('__next_f.push([1,"')

    # 그 string 의 종료 = unescaped `"` (다음 chunk separator `"])` 직전).
    # JSON string 처럼 백슬래시 escape 가 있으니 한 글자씩 스캔
    i = str_start
    while i < len(html):
        ch = html[i]
        if ch == "\\":
            i += 2
            continue
        if ch == '"':
            str_end = i
            break
        i += 1
    else:
        raise ValueError("end quote not found")

    escaped = html[str_start:str_end]
    # JSON-style unescape
    decoded = json.loads(f'"{escaped}"')

    # 본문 = '## 개요' 부터 끝까지
    body_start = decoded.find("## 개요")
    if body_start < 0:
        return decoded
    return decoded[body_start:]


def call_claude(prompt: str, timeout: int = 240) -> str:
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    claude_cmd = shutil.which("claude") or "claude"
    result = subprocess.run(
        [claude_cmd, "-p", "-"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=timeout,
        env=env,
        encoding="utf-8",
        shell=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"claude CLI 실패: {result.stderr[:500]}")
    return result.stdout


def rewrite_with_claude(original_md: str, original_title: str, original_summary: str) -> dict:
    """공공기관 → 일반 조직 어조로 재작성. JSON 반환."""
    prompt = f"""아래는 '공공기관' 타겟으로 작성된 가이드입니다. 이 콘텐츠를 **일반 조직/기업 실무자** 타겟으로 톤을 바꿔 재작성해주세요.

# 원본 메타
- 제목: {original_title}
- 한 줄 설명: {original_summary}

# 원본 본문 (markdown)
{original_md}

# 재작성 규칙
- 공공기관 specific 단어/사례 → 일반 조직 단어/사례로 자연스럽게 교체:
  * '공공기관' → '조직' 또는 '기업'
  * '공공행정' → '비즈니스' 또는 '실무'
  * '민원' → '고객' 또는 '문의'
  * '행정 보고서' → '업무 보고서' 또는 '비즈니스 보고서'
  * '법령/조항' → '규정/정책' (또는 적절한 비즈니스 용어)
  * '공무원' → '실무자' 또는 '담당자'
  * '예산 수치' → '재무 수치' 또는 '실적 수치'
  * '법무·감사 부서' → '컴플라이언스 팀' 또는 '관리 부서'
  * '복지 급여' 등 공공 specific 사례 → 비즈니스 사례 (예: '환불 정책', '근태 규정')
- 단순 단어 치환이 아니라 **문맥상 자연스럽게** 흐르도록. 어색하면 문장 다시 써도 됨
- 마크다운 헤딩(##, ###), 인용(>), 리스트, 표 구조는 유지
- 분량은 비슷하게 유지

# 출력 형식 — JSON ONLY (코드펜스 없이 또는 ```json ... ``` 안에)
{{
  "title": "재작성된 제목 (공공기관 색 제거)",
  "summary": "재작성된 한 줄 설명 (40~80자)",
  "body": "재작성된 markdown 본문",
  "category": "AI 기초 | 실무 활용 | 기술 심화 중 하나",
  "difficulty": "입문 | 기초 | 심화 중 하나",
  "tldr": ["핵심1", "핵심2", "핵심3"],
  "tags": ["태그1", "태그2", "태그3", ...]
}}"""

    raw = call_claude(prompt)
    # JSON 블록 추출
    m = re.search(r"```(?:json)?\s*(\{[\s\S]+?\})\s*```", raw)
    json_str = m.group(1) if m else None
    if not json_str:
        # 코드펜스 없이 raw JSON
        m = re.search(r"\{[\s\S]+\}", raw)
        if m:
            json_str = m.group(0)
    if not json_str:
        raise ValueError(f"claude 응답에서 JSON 못 찾음. 앞 200자: {raw[:200]}")
    return json.loads(json_str)


def slug_to_ko(public_ax_slug: str) -> str:
    """public-ax slug → 우리 slug. -for-public-sector 제거."""
    s = public_ax_slug.replace("-for-public-sector", "")
    return s


def main() -> None:
    if len(sys.argv) < 2:
        print("사용법: uv run python scripts/import_public_ax_guide.py <public-ax-slug>")
        print("예시:   uv run python scripts/import_public_ax_guide.py vibe-coding-for-public-sector")
        sys.exit(1)

    public_slug = sys.argv[1]
    url = BASE.format(slug=public_slug)
    print(f"[1] fetch: {url}")
    html = fetch_raw(url)

    title = extract_meta(html, "og:title") or ""
    summary = extract_meta(html, "og:description") or ""
    cover = extract_meta(html, "og:image")
    print(f"  title: {title}")
    print(f"  summary: {summary}")
    print(f"  cover: {cover}")

    print(f"\n[2] extract markdown body")
    body_md = extract_markdown(html)
    print(f"  body length: {len(body_md)} chars")
    (OUT / f"{public_slug}_original.md").write_text(body_md, encoding="utf-8")

    print(f"\n[3] claude CLI 재작성 (공공기관 → 일반 조직, 1~3분 소요)")
    rewritten = rewrite_with_claude(body_md, title, summary)
    print(f"  새 제목: {rewritten.get('title')}")
    print(f"  새 카테고리: {rewritten.get('category')} / 난이도: {rewritten.get('difficulty')}")
    print(f"  새 본문 길이: {len(rewritten.get('body', ''))} chars")
    (OUT / f"{public_slug}_rewritten.json").write_text(
        json.dumps(rewritten, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\n[4] {{image:xxx}} placeholder → markdown 이미지 링크 변환")
    new_body = rewritten.get("body", body_md)
    images = []
    image_url_tpl = f"https://public-ax.kr/guides/{public_slug}-{{id}}.png"
    for m in re.finditer(r"\{\{image:([\w\-]+)\}\}", new_body):
        img_id = m.group(1)
        images.append({
            "id": img_id,
            "type": "diagram",
            "description": img_id,
            "url": image_url_tpl.format(id=img_id),
        })
    new_body = re.sub(
        r"\{\{image:([\w\-]+)\}\}",
        lambda m: f"![{m.group(1)}]({image_url_tpl.format(id=m.group(1))})",
        new_body,
    )
    print(f"  이미지 {len(images)}개 변환")

    print(f"\n[5] supabase upsert (status=draft)")
    new_slug = slug_to_ko(public_slug)
    from supabase import create_client
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    payload = {
        "slug": new_slug,
        "title": rewritten.get("title", title),
        "summary": rewritten.get("summary", summary),
        "body": new_body,
        "cover_url": cover,
        "category": rewritten.get("category", ""),
        "difficulty": rewritten.get("difficulty", ""),
        "tldr": rewritten.get("tldr", []),
        "tags": rewritten.get("tags", []),
        "videos": [],
        "images": images,
        "status": "draft",
        "published_at": None,
        "author_name": "DAEASY",
    }
    res = sb.table("guides").upsert(payload, on_conflict="slug").execute()
    rows = res.data or []
    print(f"  upsert: {len(rows)} row, slug={new_slug}")

    print(f"\n✅ 임포트 완료 (draft 상태)")
    print(f"   검토: Supabase Studio → guides → slug='{new_slug}'")
    print(f"   본문 OK 면 status='published' 로 변경 → /guides 에 노출")


if __name__ == "__main__":
    main()
