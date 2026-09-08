import json
import re
import subprocess
import time
from datetime import date

from shared.storage import load_raw_items, save_draft
from shared.utils import fetch_article_text
from writer.prompts import CLUSTER_PROMPT_TEMPLATE, FEEDBACK_SECTION_TEMPLATE, SYSTEM_PROMPT, WRITER_PROMPT_TEMPLATE


URL_LINK_PATTERN = re.compile(r'\[([^\]]+)\]\((https?://[^\)]+)\)')

# 크롤러가 저장하는 content 는 RSS 요약(중앙값 74~300자)이라, 선정된 출처는 기사 본문을 따로 가져온다.
# 이 세 소스만 — GitHub·HF·arXiv 는 content 가 곧 원문(description / abstract)이다.
FULLTEXT_SOURCES = {"ai_news", "ai_blogs", "kr_ai_policy"}
FULLTEXT_MAX_CHARS = 3000
_FULLTEXT_CACHE: dict[str, str | None] = {}  # url → 본문. 실패도 None 으로 기억 — 재작성 3회 동안 재요청 없음


def fetch_fulltexts(items: list[dict], indices: set[int]) -> dict[int, str]:
    """선정 항목의 기사 본문을 가져온다. 실패·짧은 결과는 빼고 돌려준다 (호출부는 요약 유지).
    순차 + 1초 간격 — 8 스레드로 수십 건을 쏘자 AI타임스가 IP 를 403 으로 막았다 (2026-09-08 실측).
    하루 20~30건이라 30초면 끝난다. 원자료의 절반이 그 소스라 속도보다 차단 안 당하는 게 우선."""
    targets = [i for i in sorted(indices) if items[i].get("source_id") in FULLTEXT_SOURCES]
    found: dict[int, str] = {}
    for i in targets:
        url = items[i]["url"]
        if url not in _FULLTEXT_CACHE:
            text = fetch_article_text(url, FULLTEXT_MAX_CHARS)
            # 요약의 2배도 안 되면 페이월·JS 렌더 껍데기 — 요약이 낫다
            ok = bool(text) and len(text) >= 2 * len(items[i].get("content") or "")
            _FULLTEXT_CACHE[url] = text if ok else None
            time.sleep(1)
        if _FULLTEXT_CACHE[url]:
            found[i] = _FULLTEXT_CACHE[url]
    if targets:
        print(f"[writer] 원문 본문 {len(found)}/{len(targets)}건 확보")
    return found


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


def find_unlinked_mentions(draft: str, items: list[dict]) -> list[str]:
    """이름만 언급되고 출처 URL 은 안 붙은 GitHub 도구를 찾는다.
    prompts.py 의 "언급한 도구는 URL 을 함께 붙인다" 규칙을 코드로 확인한다 (경고만, 차단 안 함).
    LLM 심사위원은 모델이 바뀌면 이걸 놓치지만 문자열 대조는 안 변한다."""
    lower = draft.lower()
    found = []
    for item in items:
        url = (item.get("url") or "").strip()
        if "github.com/" not in url or url in draft:
            continue
        repo = url.rstrip("/").rsplit("/", 1)[-1]
        if len(repo) >= 5 and repo.lower() in lower:
            found.append(f"{repo} → {url}")
    return found


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
    selected: set[int] = set()  # 주요 클러스터 항목 — 이들만 원문 본문을 가져온다
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
                    selected.add(int(idx) - 1)
                    raw_items_text += f"- [{item['source_name']}] {item['title']} ({item['url']})\n"
                except (IndexError, ValueError):
                    pass

    fulltexts = fetch_fulltexts(items, selected)

    raw_items_text += "\n### 전체 수집 항목\n"
    for i, item in enumerate(items):
        if i >= 50 and i not in selected:  # 50건 컷은 유지하되 선정 항목은 순번 무관하게 포함
            continue
        body = fulltexts.get(i)
        raw_items_text += (
            f"{i+1}. [{item['source_name']}] {item['title']}\n"
            + (f"   본문(원문 발췌): {body.replace(chr(10), chr(10) + '   ')}\n" if body else f"   {item['content'][:300]}\n")
            + f"   출처: {item['url']}\n\n"
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
    unlinked = find_unlinked_mentions(cleaned, items)
    if unlinked:
        print(f"[writer] 출처 링크 누락 의심 {len(unlinked)}건: {', '.join(unlinked)}")
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


if __name__ == "__main__":
    # 자체 체크: 이름만 나오면 잡고, 링크가 붙어 있거나 언급이 없으면 조용해야 한다.
    # 실행: cd insights && PYTHONPATH=.. uv run python -m writer.writer
    _items = [
        {"url": "https://github.com/mksglu/context-mode"},
        {"url": "https://github.com/microsoft/markitdown"},
        {"url": "https://github.com/heygen-com/hyperframes"},
    ]
    _draft = "context-mode 는 좋다. [markitdown](https://github.com/microsoft/markitdown) 도 쓸 만하다."
    assert find_unlinked_mentions(_draft, _items) == [
        "context-mode → https://github.com/mksglu/context-mode"
    ], find_unlinked_mentions(_draft, _items)

    # 본문 추출: nav/footer 는 통째로 버리고, 본문 밖의 긴 배너 <p> 와 관련기사 카드 <article> 에 속지 않고
    # (2026-09-08 TechCrunch·AI타임스 실측 실패 사례), 본문 안에서도 40자 미만 <p>(캡션·버튼)는 뺀다
    from shared.utils import extract_article_text
    _html = (
        "<html><body><nav><p>" + "메뉴 " * 20 + "</p></nav>"
        "<div class='banner'><p>" + "티켓 할인 배너 " * 8 + "</p></div>"
        "<article class='card'><p>관련기사 제목</p></article>"
        "<article><p>짧은 캡션</p><p>" + "본문 문장입니다. " * 6 + "</p><p>" + "둘째 문단입니다. " * 6 + "</p></article>"
        "<footer><p>" + "저작권 " * 20 + "</p></footer></body></html>"
    )
    _text = extract_article_text(_html)
    assert _text.startswith("본문 문장입니다.") and "둘째 문단" in _text, _text
    assert all(k not in _text for k in ("메뉴", "저작권", "캡션", "배너", "관련기사")), _text
    print("OK")
