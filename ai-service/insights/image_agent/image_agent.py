import os
import re
import shutil
import subprocess
from urllib.parse import urljoin, urlparse

from shared.utils import fetch_og_image, fetch_unsplash_image, mirror_image_to_storage

# og:image가 항상 로고/플레이스홀더인 도메인 (의미 있는 이미지 추출 불가)
EXCLUDE_DOMAINS = {"arxiv.org"}

# 번호 항목("1. ### 소제목") 시작 줄. 첫 파트는 앞에 태그 주석·제목·"## 핵심 인사이트"가
# 붙어 있으므로 파트 맨 앞이 아니라 파트 안 어디서든 찾아야 한다.
ITEM_START = re.compile(r'(?m)^\d+\.\s')


def _extract_unsplash_query(draft: str) -> str:
    """헤드라인+소제목을 Claude CLI에 보내 Unsplash 검색용 영어 키워드 1줄을 받는다.
    실패 시 빈 문자열 반환 → 호출부가 폴백 키워드 사용."""
    lines = draft.splitlines()
    title_lines = [l for l in lines if l.startswith("# ") or l.strip().startswith("### ")]
    summary = "\n".join(title_lines[:8]) or draft[:600]

    prompt = (
        "다음은 AI 동향 일일 인사이트 리포트의 헤드라인과 핵심 인사이트 소제목입니다.\n"
        "이 리포트의 커버 사진으로 쓸 Unsplash 검색 키워드를 영어 1~3 단어로 1줄만 출력하세요.\n\n"
        "규칙:\n"
        "- 추상적이고 시각적인 일반 명사 (스톡 사진이 풍부한 단어)\n"
        "- 브랜드명(OpenAI, Google, Anthropic 등)은 피한다 — Unsplash에서 직접 매칭 안 됨\n"
        "- 답은 키워드만. 따옴표·접두어·마침표·설명 없이.\n\n"
        f"{summary}\n\n"
        "검색 키워드:"
    )

    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    claude_cmd = shutil.which("claude") or "claude"
    try:
        result = subprocess.run(
            [claude_cmd, "-p", "-"],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=60,
            env=env,
            encoding="utf-8",
            shell=True,
        )
    except Exception as e:
        print(f"[image_agent] keyword 추출 실패: {e}")
        return ""

    if result.returncode != 0:
        print(f"[image_agent] keyword 추출 CLI 오류: {result.stderr[:120]}")
        return ""

    output = (result.stdout or "").strip()
    if not output:
        return ""
    first_line = output.splitlines()[0].strip()
    return first_line.strip("\"'`*").strip()


def _resolve_image(page_url: str, img_url: str | None) -> str | None:
    """og:image가 상대 경로면 절대 URL로 변환. 절대 URL이면 그대로."""
    if not img_url:
        return None
    if img_url.startswith(("http://", "https://")):
        return img_url
    return urljoin(page_url, img_url)


def insert_section_images(draft: str, item_urls: set[str], skip_first_n: int = 0) -> str:
    """--- 구분선 기준으로 섹션 분리 후 각 섹션 앞에 og:image 삽입.
    arxiv 등 의미 없는 og:image 도메인은 제외, 상대 경로는 절대로 변환.

    skip_first_n: image-only retry 시 항목 내 첫 N개 출처 매치를 건너뛰고
    그 다음 매치부터 시도 (다른 출처 우선)."""
    parts = re.split(r'\n---\n', draft)

    url_pattern = re.compile(r'\[([^\]]+)\]\((https?://[^\)]+)\)')
    seen_urls: set[str] = set()

    new_parts = []
    for part in parts:
        item_start = ITEM_START.search(part)
        if not item_start:
            new_parts.append(part)
            continue

        matches = list(url_pattern.finditer(part))
        candidates = matches[skip_first_n:] if skip_first_n < len(matches) else []
        for m in candidates:
            url = m.group(2)
            if url not in item_urls or url in seen_urls:
                continue
            if urlparse(url).hostname in EXCLUDE_DOMAINS:
                continue
            img = _resolve_image(url, fetch_og_image(url))
            if img:
                # 원본 삭제·핫링크 차단 대비 우리 Storage 로 복사. 실패 시 원본 URL 그대로
                img = mirror_image_to_storage(img) or img
                seen_urls.add(url)
                i = item_start.start()
                part = part[:i] + f"![source-image]({img})\n\n" + part[i:]
                break

        new_parts.append(part)

    return "\n---\n".join(new_parts)


def run(draft: str, items: list[dict], section_skip: int = 0) -> tuple[str, str | None, str | None]:
    """draft에 섹션 og:image 삽입 + Unsplash 커버 이미지/검색어 반환.
    반환: (draft, cover_image_url, cover_query).

    section_skip: image-only retry 시 항목 내 첫 N개 출처 매치를 건너뛰고
    그 다음 매치부터 og:image를 잡는다. 0이면 첫 매치부터 (기본 동작)."""
    item_urls = {item["url"] for item in items}

    if section_skip:
        print(f"[image_agent] 섹션 이미지 수집 중 (출처 {section_skip}개 skip)...")
    else:
        print("[image_agent] 섹션 이미지 수집 중...")
    draft = insert_section_images(draft, item_urls, skip_first_n=section_skip)

    cover_image = None
    cover_query = None
    unsplash_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if unsplash_key:
        cover_query = _extract_unsplash_query(draft) or "artificial intelligence technology"
        print(f"[image_agent] Unsplash 검색어: {cover_query}")
        cover_image = fetch_unsplash_image(cover_query, unsplash_key)
        if cover_image:
            print(f"[image_agent] 커버 이미지 획득: {cover_image[:60]}...")

    return draft, cover_image, cover_query


if __name__ == "__main__":
    # 자체 체크: 항목 N개면 이미지도 N개, 각각 자기 번호 줄 바로 위에 붙어야 한다.
    # (과거엔 첫 파트에 문서 헤더가 붙어 있어 1번 항목이 통째로 스킵됐다)
    fetch_og_image = lambda url: f"https://img.test/{urlparse(url).path.strip('/')}.jpg"  # noqa: E731
    mirror_image_to_storage = lambda url: None  # noqa: E731 — 네트워크 없이 원본 폴백 경로 검증

    urls = [f"https://ex.com/{n}" for n in range(1, 6)]
    draft = "<!-- tags: a, b -->\n\n# 헤드라인\n\n## 핵심 인사이트\n\n" + "\n---\n".join(
        f"{n}. ### 소제목 {n}\n\n   본문\n\n   [출처]({u})\n" for n, u in enumerate(urls, 1)
    )

    out = insert_section_images(draft, set(urls))
    lines = [ln for ln in out.splitlines() if ln.startswith("![source-image]") or ITEM_START.match(ln)]

    assert len(lines) == 10, f"항목 5 + 이미지 5 = 10줄이어야 함, 실제 {len(lines)}"
    for n in range(5):
        img, item = lines[2 * n], lines[2 * n + 1]
        assert img == f"![source-image](https://img.test/{n + 1}.jpg)", f"{n + 1}번 이미지 불일치: {img}"
        assert item.startswith(f"{n + 1}. "), f"{n + 1}번 항목이 이미지 바로 뒤에 없음: {item}"
    print("self-check OK: 5개 항목 모두 자기 이미지를 바로 위에 가짐")
