"""32개 dataeasy.kr 과정 상세 페이지를 일괄 스크랩 → courses.description 업데이트.

전제: scrape_courses_map.py 가 _poc_out/mapping.json 을 만들었음.

usage:
    cd ai-service
    uv run python scripts/scrape_courses_full.py            # dry-run (DB update 안 함)
    uv run python scripts/scrape_courses_full.py --apply    # DB update 실행
"""
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import Page, sync_playwright
from supabase import create_client

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv(Path(__file__).parent.parent / ".env")

EMAIL = os.environ["DATAEASY_EMAIL"]
PASSWORD = os.environ["DATAEASY_PASSWORD"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
APPLY = "--apply" in sys.argv

OUT = Path(__file__).parent / "_poc_out"
SCRAPE_DIR = OUT / "scraped"
SCRAPE_DIR.mkdir(exist_ok=True, parents=True)


def login(page: Page) -> None:
    page.fill('input[type="email"], input[name="email"], input[placeholder*="이메일"]', EMAIL)
    page.fill('input[type="password"], input[name="password"], input[placeholder*="비밀번호"]', PASSWORD)
    page.get_by_role("button", name="로그인").first.click()
    page.wait_for_load_state("networkidle", timeout=30000)
    page.wait_for_timeout(1500)


def extract_main(page: Page) -> tuple[str, str]:
    for sel in ["#section_default", "#section_default_skin", ".imweb_section", "main", "#content"]:
        loc = page.locator(sel).first
        if loc.count() > 0:
            try:
                html = loc.evaluate("el => el.outerHTML")
                text = loc.inner_text()
                if len(text) > 200:
                    return html, text
            except Exception:
                continue
    return page.content(), page.inner_text("body")


def collect_modules(page: Page) -> list[tuple[str, str, str]]:
    """모듈 N 탭이 있으면 순회, 각 탭의 (이름, text, html) 수집."""
    out = []
    for i in range(1, 10):
        loc = page.get_by_text(f"모듈 {i}", exact=False).first
        if loc.count() == 0:
            break
        try:
            loc.click(timeout=3000)
            page.wait_for_timeout(700)
        except Exception:
            break
        html, text = extract_main(page)
        out.append((f"모듈 {i}", text, html))
    return out


_HEADER_MARK = "데이터분석 맞춤형 교육 커리큘럼을 통해 쉽게 접근하고 배울 수 있도록 설계하였습니다."
_FOOTER_MARKS = [
    "트랙 목록으로 돌아가기", "과정 신청하기", "기업 맞춤형 교육 문의하기",
    "돌아가기 강의신청하기", "강의신청하기 교육 문의하기", "©Copyright",
    "※본 교육 과정의 특성상",
]


def trim_chrome(text: str) -> str:
    """헤더(nav 영역) 와 footer 잘라내기."""
    i = text.find(_HEADER_MARK)
    if i >= 0:
        text = text[i + len(_HEADER_MARK):]
    # footer marks 중 가장 먼저 나오는 위치까지
    end = len(text)
    for mark in _FOOTER_MARKS:
        j = text.find(mark)
        if j >= 0 and j < end:
            end = j
    return text[:end].strip()


def text_to_html(text: str) -> str:
    """클린 text 를 <p> 단락으로 감싸서 description 저장용 HTML 생성."""
    # 빈 줄 기준 paragraph
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    out = []
    for p in paras:
        # 같은 paragraph 안의 줄바꿈은 <br>
        lines = [line.strip() for line in p.split("\n") if line.strip()]
        if not lines:
            continue
        # 단일 줄이고 짧으면 헤딩일 가능성
        if len(lines) == 1 and len(lines[0]) <= 30 and not lines[0].endswith("."):
            out.append(f"<h3>{lines[0]}</h3>")
        else:
            out.append("<p>" + "<br>".join(lines) + "</p>")
    return "\n".join(out)


def scrape_one(page: Page, slug: str, url: str) -> dict:
    print(f"  [{slug}] {url}")
    try:
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)
        # 로그인 폼이 다시 떴는지 (세션 만료) 체크 — 그러면 다시 로그인
        if page.locator('input[type="password"]').count() > 0:
            print(f"  [!] re-login required for {slug}")
            login(page)
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)

        _, base_text = extract_main(page)
        base_clean = trim_chrome(base_text)

        modules = collect_modules(page)
        if modules:
            # base 에 이미 모듈 1 차시 표가 있음. 모듈 2/3/4 의 "소요시간" 부분만 추출해 추가.
            blocks = [base_clean]
            seen_tables: set[str] = set()
            # base 의 모듈 1 표 등록
            base_tbl_idx = base_clean.find("소요시간")
            if base_tbl_idx >= 0:
                seen_tables.add(base_clean[base_tbl_idx:base_tbl_idx + 200])

            for name, mtext, _ in modules:
                clean = trim_chrome(mtext)
                tbl_idx = clean.find("소요시간")
                if tbl_idx < 0:
                    continue
                tbl = clean[tbl_idx:]
                key = tbl[:200]
                if key in seen_tables:
                    continue
                seen_tables.add(key)
                blocks.append(f"\n[{name}]\n{tbl}")
            combined_text = "\n\n".join(blocks)
        else:
            combined_text = base_clean

        clean_html = text_to_html(combined_text)

        (SCRAPE_DIR / f"{slug}.txt").write_text(combined_text, encoding="utf-8")
        (SCRAPE_DIR / f"{slug}.html").write_text(clean_html, encoding="utf-8")
        return {
            "slug": slug,
            "url": url,
            "text_len": len(combined_text),
            "html_len": len(clean_html),
            "modules": len(modules),
        }
    except Exception as e:
        print(f"  [!] {slug} failed: {e}")
        return {"slug": slug, "url": url, "error": str(e)}


def main() -> None:
    mapping_path = OUT / "mapping.json"
    if not mapping_path.exists():
        print(f"매핑 파일 없음: {mapping_path}. scrape_courses_map.py 먼저 실행.")
        sys.exit(1)
    review = json.loads(mapping_path.read_text(encoding="utf-8"))["review"]
    print(f"targets: {len(review)}")
    print(f"mode: {'APPLY (DB update)' if APPLY else 'DRY-RUN (no DB write)'}")

    summary = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 1200})
        page = ctx.new_page()

        # 첫 페이지 로그인
        page.goto(review[0]["source_url"], wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)
        if page.locator('input[type="password"]').count() > 0:
            print("[login]")
            login(page)

        for i, item in enumerate(review):
            slug = item["slug"]
            url = item["source_url"]
            t0 = time.time()
            r = scrape_one(page, slug, url)
            r["elapsed"] = round(time.time() - t0, 2)
            summary.append(r)
            print(f"  ({i+1}/{len(review)}) done in {r['elapsed']}s")

        browser.close()

    (OUT / "scrape_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    ok = [s for s in summary if "error" not in s]
    fail = [s for s in summary if "error" in s]
    print(f"\n--- scrape result: {len(ok)} ok, {len(fail)} failed ---")
    if fail:
        for f in fail:
            print(f"  FAIL {f['slug']}: {f.get('error')}")

    if not APPLY:
        print("\nDRY-RUN: DB 업데이트는 건너뜀. --apply 로 다시 실행.")
        return

    print(f"\n[DB update] supabase: {SUPABASE_URL}")
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    for s in ok:
        slug = s["slug"]
        html = (SCRAPE_DIR / f"{slug}.html").read_text(encoding="utf-8")
        res = sb.table("courses").update({"description": html}).eq("slug", slug).execute()
        print(f"  updated {slug}: {len(res.data or [])} row(s)")
    print("[done]")


if __name__ == "__main__":
    main()
