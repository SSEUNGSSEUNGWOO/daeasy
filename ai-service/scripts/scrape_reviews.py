"""dataeasy.kr/review 의 15개 후기를 cases 테이블에 자동 삽입.

- /review 인덱스에서 idx 추출
- 각 idx 페이지 fetch → og:title / og:description / og:image
- conducted_at 은 og:image URL 의 /thumbnail/YYYYMMDD/... 패턴에서 추출
- cases 테이블에 upsert (slug = review-{idx})

usage:
    cd ai-service
    uv run python scripts/scrape_reviews.py            # dry-run
    uv run python scripts/scrape_reviews.py --apply    # DB 적용
"""
import html as html_lib
import json
import os
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv(Path(__file__).parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
APPLY = "--apply" in sys.argv

INDEX_URL = "https://dataeasy.kr/review"
DETAIL_TPL = "https://dataeasy.kr/review/?bmode=view&idx={idx}&t=board"
OUT = Path(__file__).parent / "_poc_out"
OUT.mkdir(exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def extract_meta(html: str, prop: str) -> str | None:
    m = re.search(rf'<meta[^>]*(?:property|name)="{re.escape(prop)}"[^>]*content="([^"]*)"', html, re.I)
    if m:
        return html_lib.unescape(m.group(1))
    return None


def collect_idxs(index_html: str) -> list[str]:
    idxs = re.findall(r"idx=(\d+)", index_html)
    seen: list[str] = []
    for i in idxs:
        if i not in seen:
            seen.append(i)
    return seen


def parse_conducted_at(image_url: str | None) -> str | None:
    """og:image URL 의 /thumbnail/YYYYMMDD/ 패턴에서 conducted_at 추출."""
    if not image_url:
        return None
    m = re.search(r"/thumbnail/(\d{4})(\d{2})(\d{2})/", image_url)
    if not m:
        return None
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


SITE_SUFFIX = re.compile(r"\s*[:|]\s*DAEASY.*$")


def clean_title(t: str | None) -> str:
    if not t:
        return ""
    return SITE_SUFFIX.sub("", t).strip().strip('"')


def first_sentence(text: str, max_len: int = 200) -> str:
    """description 첫 문장 — summary 용."""
    if not text:
        return ""
    cleaned = re.sub(r"\s+", " ", text).strip()
    # 마침표/물음표/느낌표 + 공백
    m = re.search(r"^.{20,200}?[.?!]", cleaned)
    if m:
        s = m.group(0)
        return s if len(s) <= max_len else s[: max_len - 1] + "…"
    return cleaned[:max_len].strip() + ("…" if len(cleaned) > max_len else "")


_FOOTER_PATTERNS = [
    re.compile(r"\[교육.*?문의\].*$", re.S),
    re.compile(r"운영사:\s*\(주\).*$", re.S),
    re.compile(r"브랜드:\s*데이지.*$", re.S),
    re.compile(r"이메일:\s*data-edu.*$", re.S),
]
_HASHTAGS_TAIL = re.compile(r"(\s*#\S+)+\s*$")
# 라벨: "한글 1~4글자 + (선택)공백 + 한글 1~4글자 + ':'". 단어 경계(시작 또는 직전 공백/한글)로 시작.
_LABEL_INLINE = re.compile(r"(?:^|(?<=[\s가-힣]))[가-힣]{2,4}(?:\s[가-힣]{1,4})?:\s+[가-힣A-Za-z\"\']")
_CIRCLED = re.compile(r"[①②③④⑤⑥⑦⑧⑨⑩]")
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[가-힣A-Z\"\'])")


def _find_heading_end(text: str, max_len: int = 30) -> int:
    """헤딩 끝 위치 — 첫 ① 또는 첫 '라벨:' 또는 max_len. 헤딩 최소 길이 2 보장."""
    candidates = []
    m = _CIRCLED.search(text)
    if m and m.start() >= 2:
        candidates.append(m.start())
    for lm in _LABEL_INLINE.finditer(text):
        if lm.start() >= 2:
            candidates.append(lm.start())
            break
    if not candidates:
        return min(max_len, len(text))
    return min(min(candidates), max_len)


def _label_paragraphs(text: str) -> list[str]:
    """문장 단위 split + '라벨: 값' 패턴이면 strong 강조."""
    out: list[str] = []
    sentences = _SENTENCE_SPLIT.split(text.strip())
    for s in sentences:
        s = s.strip().strip(",.")
        if not s:
            continue
        m = re.match(r"^([가-힣A-Za-z][가-힣A-Za-z\s\(\)/]{1,15}):\s+(.+)$", s)
        if m and not m.group(2).startswith(("//", "http")):
            label, val = m.group(1).strip(), m.group(2).strip()
            out.append(
                f'<p><strong class="text-[#0F0F0F]">{html_lib.escape(label)}:</strong> '
                f'{html_lib.escape(val)}</p>'
            )
        else:
            out.append(f"<p>{html_lib.escape(s)}</p>")
    return out


def _render_circled_section(text: str) -> list[str]:
    """① ~ ⑩ 서브헤딩 단위로 split → h4 + 본문."""
    out: list[str] = []
    parts = re.split(r"(?=[①②③④⑤⑥⑦⑧⑨⑩])", text)
    for p in parts:
        p = p.strip()
        if not p:
            continue
        m = re.match(r"^([①②③④⑤⑥⑦⑧⑨⑩])\s*(.*)", p, re.S)
        if m:
            marker, rest = m.group(1), m.group(2)
            cut = _find_heading_end(rest, max_len=30)
            heading = rest[:cut].strip().strip(",.")
            body = rest[cut:].strip()
            out.append(
                f'<h4 class="mt-6 text-[16px] font-bold text-[#0F0F0F]">'
                f'{marker} {html_lib.escape(heading)}</h4>'
            )
            if body:
                out.extend(_label_paragraphs(body))
        else:
            out.extend(_label_paragraphs(p))
    return out


def description_to_html(text: str) -> str:
    """본 사이트 og:description (한 덩어리) → 가독성 있는 HTML.
    - 푸터/해시태그 제거
    - "1.", "2." 으로 시작하는 헤딩(h3)
    - "①", "②" 서브헤딩(h4)
    - "라벨: 값" 패턴은 strong 강조
    - 마침표 단위 단락 분리
    """
    if not text:
        return ""

    for pat in _FOOTER_PATTERNS:
        text = pat.sub("", text)
    text = _HASHTAGS_TAIL.sub("", text)
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return ""

    # major chunks: "숫자. + 한글/영어대문자"
    chunks = re.split(r"(?=\b\d{1,2}\.\s+[가-힣A-Z])", cleaned)
    chunks = [c.strip() for c in chunks if c.strip()]

    out: list[str] = []
    intro_done = False
    for chunk in chunks:
        m = re.match(r"^(\d{1,2})\.\s+(.+)", chunk, re.S)
        if m and intro_done:
            num, rest = m.group(1), m.group(2)
            cut = _find_heading_end(rest, max_len=25)
            heading = rest[:cut].strip().strip(",.")
            body = rest[cut:].strip()
            out.append(
                f'<h3 class="mt-10 text-[20px] font-extrabold text-[#0F0F0F]">'
                f'{num}. {html_lib.escape(heading)}</h3>'
            )
            if body:
                out.extend(_render_circled_section(body))
        else:
            # 첫 chunk 또는 split 안 된 chunk = intro
            intro_done = True
            out.extend(_label_paragraphs(chunk))
    return "\n".join(out)


def make_slug(idx: str) -> str:
    return f"review-{idx}"


def scrape_one(idx: str) -> dict:
    url = DETAIL_TPL.format(idx=idx)
    html = fetch(url)
    title = clean_title(extract_meta(html, "og:title"))
    desc = extract_meta(html, "og:description") or ""
    image = extract_meta(html, "og:image")
    conducted_at = parse_conducted_at(image)

    return {
        "slug": make_slug(idx),
        "title": title,
        "summary": first_sentence(desc),
        "description": description_to_html(desc),
        "client_name": None,  # 필요 시 사용자가 admin UI 또는 SQL 로 추가
        "conducted_at": conducted_at,
        "thumbnail_url": image,
        "status": "published",
        "_idx": idx,
        "_url": url,
    }


def main() -> None:
    print(f"index fetch: {INDEX_URL}")
    idxs = collect_idxs(fetch(INDEX_URL))
    print(f"  found {len(idxs)} review idx(s)")

    rows = []
    for i, idx in enumerate(idxs):
        try:
            r = scrape_one(idx)
            print(f"  ({i+1}/{len(idxs)}) {idx}: {r['title'][:50]} … img={'O' if r['thumbnail_url'] else 'X'} date={r['conducted_at']}")
            rows.append(r)
        except Exception as e:
            print(f"  ({i+1}/{len(idxs)}) {idx}: FAIL {e}")

    (OUT / "reviews.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2, default=str), encoding="utf-8"
    )
    print(f"\nsaved: {OUT / 'reviews.json'}")

    if not APPLY:
        print("DRY-RUN: --apply 로 다시 실행하면 DB 업데이트")
        return

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print(f"\n[DB upsert] {SUPABASE_URL}")
    for r in rows:
        # 내부 필드 제거
        payload = {k: v for k, v in r.items() if not k.startswith("_")}
        res = sb.table("cases").upsert(payload, on_conflict="slug").execute()
        print(f"  {r['slug']}: {len(res.data or [])} row(s)")
    print("[done]")


if __name__ == "__main__":
    main()
