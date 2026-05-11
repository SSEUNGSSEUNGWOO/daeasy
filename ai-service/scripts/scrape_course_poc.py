"""dataeasy.kr 한 과정 상세 페이지 완전형 추출 PoC.
- 로그인 후 진입
- 모듈/탭이 있으면 모두 클릭해서 펼친 상태 보존
- 본문 컨테이너의 HTML 을 추출

usage:
    cd ai-service
    uv run python scripts/scrape_course_poc.py
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import Page, sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv(Path(__file__).parent.parent / ".env")

EMAIL = os.environ["DATAEASY_EMAIL"]
PASSWORD = os.environ["DATAEASY_PASSWORD"]
TARGET = "https://dataeasy.kr/financial_leadership"
OUT_DIR = Path(__file__).parent / "_poc_out"
OUT_DIR.mkdir(exist_ok=True)


def login(page: Page) -> None:
    page.fill('input[type="email"], input[name="email"], input[placeholder*="이메일"]', EMAIL)
    page.fill('input[type="password"], input[name="password"], input[placeholder*="비밀번호"]', PASSWORD)
    page.get_by_role("button", name="로그인").first.click()
    page.wait_for_load_state("networkidle", timeout=30000)
    page.wait_for_timeout(2000)


def extract_main_content(page: Page, silent: bool = False) -> tuple[str, str]:
    """본문 컨테이너의 HTML과 텍스트를 추출.
    imweb 사이트는 보통 #section_default 또는 #section_default_skin 같은 영역에 본문이 들어감.
    잡히는 셀렉터를 순서대로 시도, 다 실패하면 main 또는 body fallback.
    """
    candidates = [
        "#section_default",
        "#section_default_skin",
        ".imweb_section",
        "main",
        "#content",
    ]
    for sel in candidates:
        loc = page.locator(sel).first
        if loc.count() > 0:
            try:
                html = loc.evaluate("el => el.outerHTML")
                text = loc.inner_text()
                if len(text) > 200:  # 의미 있는 콘텐츠
                    if not silent:
                        print(f"  [extract] used selector: {sel}")
                    return html, text
            except Exception:
                continue
    if not silent:
        print("  [extract] fallback to body")
    return page.content(), page.inner_text("body")


def collect_module_contents(page: Page) -> list[tuple[str, str, str]]:
    """모듈 탭이 있으면 각 탭을 순회하며 (탭이름, 텍스트, html) 수집.
    탭이 없으면 빈 리스트 반환 → 호출자가 단일 콘텐츠 추출.
    """
    results: list[tuple[str, str, str]] = []
    for i in range(1, 10):
        loc = page.get_by_text(f"모듈 {i}", exact=False).first
        if loc.count() == 0:
            break
        try:
            loc.click(timeout=3000)
            page.wait_for_timeout(700)
        except Exception as e:
            print(f"  [tabs] click 모듈 {i} failed: {e}")
            break
        html, text = extract_main_content(page, silent=True)
        results.append((f"모듈 {i}", text, html))
        print(f"  [tabs] 모듈 {i}: text={len(text)} html={len(html)}")
    return results


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 1200})
        page = ctx.new_page()

        page.goto(TARGET, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)
        print("[1] login")
        login(page)

        # 로그인 후 같은 URL 머무는지 확인, 다르면 다시 navigate
        if "/financial_leadership" not in page.url:
            page.goto(TARGET, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)

        print("[2] base content (no tab clicked yet)")
        base_html, base_text = extract_main_content(page)

        print("[3] iterate module tabs")
        modules = collect_module_contents(page)

        # 합치기 — base 의 헤더(학습목표/대상/교육시간) + 각 모듈 콘텐츠
        if modules:
            combined_text = base_text + "\n\n" + "\n\n".join(
                f"=== {name} ===\n{text}" for name, text, _ in modules
            )
            combined_html = base_html + "\n<!-- modules -->\n" + "\n".join(
                f"<section data-module=\"{name}\">{html}</section>"
                for name, _, html in modules
            )
        else:
            combined_text = base_text
            combined_html = base_html

        (OUT_DIR / "rendered.html").write_text(combined_html, encoding="utf-8")
        (OUT_DIR / "rendered.txt").write_text(combined_text, encoding="utf-8")
        page.screenshot(path=str(OUT_DIR / "screenshot.png"), full_page=True)

        keywords = ["커리큘럼", "학습 목표", "학습 대상", "교육 시간", "모듈 1", "모듈 2", "모듈 3", "모듈 4"]
        found = {k: combined_text.count(k) for k in keywords if k in combined_text}

        print(f"--- final url: {page.url} ---")
        print(f"combined HTML length: {len(combined_html)}")
        print(f"combined text length: {len(combined_text)}")
        print(f"modules collected: {len(modules)}")
        print(f"keyword hits: {found}")
        print(f"--- artifacts: {OUT_DIR} ---")

        browser.close()


if __name__ == "__main__":
    main()
