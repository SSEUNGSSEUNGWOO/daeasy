"""dataeasy.kr/program 에서 32개 과정 카드의 (제목, href) 추출.
우리 DB(courses 테이블)의 title 과 매칭해 (our_slug, source_url) 매핑을 출력.
결과는 _poc_out/mapping.json 으로 저장.

usage:
    cd ai-service
    uv run python scripts/scrape_courses_map.py
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv(Path(__file__).parent.parent / ".env")

EMAIL = os.environ["DATAEASY_EMAIL"]
PASSWORD = os.environ["DATAEASY_PASSWORD"]
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
PROGRAM_URL = "https://dataeasy.kr/program"
OUT = Path(__file__).parent / "_poc_out"
OUT.mkdir(exist_ok=True)


def fetch_db_courses() -> list[dict]:
    """우리 backend API에서 32개 (slug, title) 가져옴."""
    with urllib.request.urlopen(f"{BACKEND_URL}/api/v1/courses") as r:
        data = json.loads(r.read())
    return [{"slug": c["slug"], "title": c["title"]} for c in data]


def normalize(s: str) -> str:
    return "".join(s.split())  # 모든 공백 제거


def main() -> None:
    db_courses = fetch_db_courses()
    print(f"DB courses: {len(db_courses)}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 1200})
        page = ctx.new_page()

        page.goto(PROGRAM_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)

        # 탭은 hidden 상태로 모든 카드를 DOM 에 갖고 있음 — 한 번에 32개 hrefs 추출
        hrefs = page.eval_on_selector_all(
            "a",
            """els => els
                .filter(a => (a.innerText || '').trim() === '자세히 보기')
                .map(a => a.getAttribute('href'))
                .filter(h => h && h.startsWith('/'))"""
        )
        print(f"hrefs collected: {len(hrefs)}")
        page.screenshot(path=str(OUT / "program_screenshot.png"), full_page=True)
        browser.close()

    # sort_order 1:1 매핑 (DB는 이미 sort_order 순)
    mapping: dict[str, str] = {}
    unmatched: list[str] = []
    for i, course in enumerate(db_courses):
        if i < len(hrefs):
            mapping[course["slug"]] = "https://dataeasy.kr" + hrefs[i]
        else:
            unmatched.append(course["slug"])

    # 사람 검토용 — slug ↔ source URL ↔ 우리 title
    review = []
    for c in db_courses:
        review.append({
            "slug": c["slug"],
            "title": c["title"],
            "source_url": mapping.get(c["slug"]),
        })

    out_file = OUT / "mapping.json"
    out_file.write_text(
        json.dumps(
            {"review": review, "unmatched": unmatched},
            ensure_ascii=False, indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\n--- result ---")
    print(f"matched: {len(mapping)} / {len(db_courses)}")
    print(f"unmatched slugs: {unmatched}")
    print(f"saved: {out_file}")


if __name__ == "__main__":
    main()
