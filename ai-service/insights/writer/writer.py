import json
import re
import subprocess
from datetime import date

from shared.storage import load_raw_items, save_draft
from writer.prompts import CLUSTER_PROMPT_TEMPLATE, FEEDBACK_SECTION_TEMPLATE, SYSTEM_PROMPT, WRITER_PROMPT_TEMPLATE


URL_LINK_PATTERN = re.compile(r'\[([^\]]+)\]\((https?://[^\)]+)\)')


def build_allowed_urls_section(items: list[dict]) -> str:
    lines = ["## 허용 URL 목록 (이 안에서만 출처 사용)"]
    for item in items:
        url = item.get("url", "").strip()
        if not url:
            continue
        lines.append(f"- [{item['source_name']}] {item['title']} → {url}")
    return "\n".join(lines)


def sanitize_urls(draft: str, allowed_urls: set[str]) -> tuple[str, list[str]]:
    removed: list[str] = []

    def replace(match: re.Match) -> str:
        text, url = match.group(1), match.group(2)
        if url in allowed_urls:
            return match.group(0)
        removed.append(url)
        return text

    cleaned = URL_LINK_PATTERN.sub(replace, draft)
    return cleaned, removed


def run_claude(prompt: str, timeout: int = 180) -> str:
    import os
    import shutil
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
        raise RuntimeError(f"claude CLI 실패: {result.stderr}")
    return result.stdout


def cluster_items(items: list[dict]) -> list[dict]:
    items_text = "\n".join(
        f"{i+1}. [{item['source_name']}] {item['title']}: {item['content'][:200]}"
        for i, item in enumerate(items)
    )
    prompt = CLUSTER_PROMPT_TEMPLATE.format(items_text=items_text)
    try:
        output = run_claude(prompt, timeout=480)
        start = output.find("{")
        end = output.rfind("}") + 1
        return json.loads(output[start:end]).get("clusters", [])
    except Exception as e:
        print(f"[writer] 클러스터링 실패: {e}")
        return []


def write_report(items: list[dict], clusters: list[dict], feedback: str = "") -> str:
    raw_items_text = ""

    high_importance = [c for c in clusters if c.get("importance", 0) >= 3]
    if high_importance:
        raw_items_text += "### 주요 클러스터 (중요도 순)\n"
        for cluster in sorted(high_importance, key=lambda x: -x.get("importance", 0)):
            raw_items_text += f"\n**{cluster['theme']}**"
            if cluster.get("relationship"):
                raw_items_text += f" — {cluster['relationship']}"
            raw_items_text += "\n"
            for idx in cluster.get("items", []):
                try:
                    item = items[int(idx) - 1]
                    raw_items_text += f"- [{item['source_name']}] {item['title']} ({item['url']})\n"
                except (IndexError, ValueError):
                    pass

    raw_items_text += "\n### 전체 수집 항목\n"
    for i, item in enumerate(items[:50]):
        raw_items_text += (
            f"{i+1}. [{item['source_name']}] {item['title']}\n"
            f"   {item['content'][:300]}\n"
            f"   출처: {item['url']}\n\n"
        )

    feedback_section = (
        FEEDBACK_SECTION_TEMPLATE.format(feedback=feedback)
        if feedback else ""
    )
    allowed_urls_section = build_allowed_urls_section(items)
    prompt = SYSTEM_PROMPT + "\n\n" + WRITER_PROMPT_TEMPLATE.format(
        raw_items_text=raw_items_text,
        allowed_urls_section=allowed_urls_section,
        date=date.today().isoformat(),
        feedback_section=feedback_section,
    )
    draft = run_claude(prompt, timeout=300)

    allowed_urls = {item["url"].strip() for item in items if item.get("url")}
    cleaned, removed = sanitize_urls(draft, allowed_urls)
    if removed:
        print(f"[writer] 화이트리스트 외 URL {len(removed)}개 자동 제거: {removed}")
    return cleaned


def run(feedback: str = "") -> str:
    items = load_raw_items(today_only=True)

    if not items:
        print("[writer] 수집된 raw_items 없음")
        return ""

    print(f"[writer] {len(items)}개 항목 클러스터링 중...")
    clusters = cluster_items(items)

    print(f"[writer] {len(clusters)}개 클러스터 → 리포트 작성 중...")
    draft = write_report(items, clusters, feedback=feedback)

    save_draft(draft)
    print("[writer] 초안 저장 완료")
    return draft
