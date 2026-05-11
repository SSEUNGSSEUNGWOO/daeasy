"""_poc_out/scraped/{slug}.txt 32개를 가독성 좋은 HTML 로 다시 변환 → DB update.

네트워크 재호출 없이 이미 받아둔 텍스트만 다시 파싱.

usage:
    cd ai-service
    uv run python scripts/build_course_html.py            # dry-run (한 슬러그 샘플 출력)
    uv run python scripts/build_course_html.py --apply    # DB update
"""
import os
import re
import sys
from html import escape
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv(Path(__file__).parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
APPLY = "--apply" in sys.argv

SCRAPE_DIR = Path(__file__).parent / "_poc_out" / "scraped"
SAMPLE_SLUG = "ai-literacy"  # dry-run 시 출력할 샘플

# 라벨 — 한 줄로 등장하면 새 섹션 헤딩
LABELS = {
    "교육 목표", "학습 목표", "학습 대상", "교육 대상",
    "핵심 내용", "교육 내용", "주요 내용",
    "교육 시간", "교육 일정", "교육 기간",
    "강사진", "강사 소개", "강의 후기",
}

# 시간 슬롯 패턴
TIME_RANGE = re.compile(r"^\d{1,2}:\d{2}\s*~\s*\d{1,2}:\d{2}\b")
HOUR_DURATION = re.compile(r"^\d+(?:\.\d+)?\s*시간\b")
TABLE_HEADER = re.compile(r"^(?:소요)?시간\s*\t")  # "시간\t파트\t..." or "소요시간\t..."

# "모듈 1: A 모듈 2: B 모듈 3: C 모듈 4: D" 형태 — 모듈 부제 일괄 정의 라인
MODULE_TITLES_LINE = re.compile(r"^모듈 \d+:\s.+(?:\s모듈 \d+:\s.+)+$")
MODULE_NUMBER_RE = re.compile(r"모듈 (\d+):\s*([^모]+?)(?=\s*모듈 \d+:|$)")

# sub-label (시간 슬롯 안의 의미 구분자)
SUB_LABELS = ("내용:", "목표:", "산출물:", "실습:", "워크숍:", "토의:", "최종 토의:")


def split_table_row(line: str) -> tuple[str, str]:
    """탭 또는 다중 공백으로 나뉜 첫 토큰을 (앞, 뒤) 로 분리.
    예: '09:00 ~ 11:00\tAI 개념' → ('09:00 ~ 11:00', 'AI 개념')
    """
    if "\t" in line:
        head, _, rest = line.partition("\t")
        return head.strip(), rest.strip()
    # 다중 공백
    parts = re.split(r"\s{2,}", line, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return line.strip(), ""


def render_items(items: list[str]) -> str:
    """라벨 다음 줄들을 ul 또는 p 로 렌더."""
    if not items:
        return ""
    if len(items) == 1:
        return f"<p>{escape(items[0])}</p>"
    lis = []
    for it in items:
        # sub-label 이 있으면 strong 으로 강조
        for sub in SUB_LABELS:
            if it.startswith(sub):
                rest = it[len(sub):].strip()
                lis.append(f"<li><strong>{escape(sub)}</strong> {escape(rest)}</li>")
                break
        else:
            lis.append(f"<li>{escape(it)}</li>")
    return "<ul>" + "".join(lis) + "</ul>"


def render_slot(time_label: str, title: str, items: list[str]) -> str:
    """시간 슬롯 한 칸 — 시간/제목 헤딩 + 항목 리스트."""
    # 슬롯 title 안에 추가 탭이 있으면 (예: "점심 시간\t휴식") 공백으로
    title = re.sub(r"\s+", " ", title).strip()
    head = escape(time_label)
    if title:
        head += f' <span class="text-zinc-500">· {escape(title)}</span>'
    out = [f'<h5 class="mt-6">{head}</h5>']
    if items:
        out.append(render_items(items))
    return "\n".join(out)


def text_to_html(text: str) -> str:
    raw_lines = text.split("\n")
    blocks: list[str] = []
    items_buf: list[str] = []
    title_set = False
    module_titles: dict[int, str] = {}  # {1: "AI 거버넌스", 2: "의사결정(DDI)", ...}
    module_1_inserted = False  # "모듈 1: ..." 헤딩이 base 에 한번 삽입됐는지

    def module_heading(n: int) -> str:
        sub = module_titles.get(n)
        label = f"모듈 {n}: {sub}" if sub else f"모듈 {n}"
        return f'<h4 class="mt-10" data-module="{n}">{escape(label)}</h4>'

    def flush_buf():
        if items_buf:
            blocks.append(render_items(items_buf))
            items_buf.clear()

    in_slot = False
    slot_time = ""
    slot_title = ""
    slot_items: list[str] = []

    def flush_slot():
        nonlocal in_slot, slot_time, slot_title, slot_items
        if in_slot:
            blocks.append(render_slot(slot_time, slot_title, slot_items))
            in_slot = False
            slot_time = ""
            slot_title = ""
            slot_items = []

    for raw in raw_lines:
        line = raw.strip()
        if not line:
            continue

        # 표 헤더 무시
        if TABLE_HEADER.match(line):
            flush_buf()
            flush_slot()
            continue

        # 코스 제목 (첫 등장 줄)
        if not title_set:
            blocks.append(f"<h3>{escape(line)}</h3>")
            title_set = True
            continue

        # "모듈 1: A 모듈 2: B 모듈 3: C 모듈 4: D" 형태 라인
        if MODULE_TITLES_LINE.match(line):
            for m in MODULE_NUMBER_RE.finditer(line):
                module_titles[int(m.group(1))] = m.group(2).strip()
            # 모듈 1 헤딩을 즉시 삽입 (base 의 첫 시간 슬롯 직전)
            if not module_1_inserted:
                flush_buf()
                flush_slot()
                blocks.append(module_heading(1))
                module_1_inserted = True
            continue

        # [모듈 N] 라벨 → 모듈 N 헤딩 (sub title 매핑)
        if line.startswith("[모듈 ") and line.endswith("]"):
            flush_buf()
            flush_slot()
            try:
                n = int(line.strip("[]").replace("모듈 ", "").strip())
            except ValueError:
                n = 0
            blocks.append(module_heading(n) if n else f'<h4 class="mt-10">{escape(line.strip("[]"))}</h4>')
            continue

        # "※ 모듈 N(10H): ..." 안내문 — 모듈 종료 알림이라 그대로 작은 안내로
        if line.startswith("※"):
            flush_buf()
            flush_slot()
            blocks.append(f'<p class="text-[14px] text-zinc-500">{escape(line)}</p>')
            continue

        # 라벨
        if line in LABELS:
            flush_buf()
            flush_slot()
            blocks.append(f'<h4 class="mt-8">{escape(line)}</h4>')
            continue

        # 시간 슬롯 시작
        if TIME_RANGE.match(line) or HOUR_DURATION.match(line):
            flush_buf()
            flush_slot()
            time_label, title = split_table_row(line)
            in_slot = True
            slot_time = time_label
            slot_title = title
            slot_items = []
            continue

        # 슬롯 내부면 항목으로
        if in_slot:
            slot_items.append(line)
        else:
            items_buf.append(line)

    flush_buf()
    flush_slot()
    return "\n".join(blocks)


def main() -> None:
    txt_files = sorted(SCRAPE_DIR.glob("*.txt"))
    print(f"found {len(txt_files)} text files")

    if not APPLY:
        print(f"\n--- DRY-RUN: sample = {SAMPLE_SLUG} ---")
        sample_path = SCRAPE_DIR / f"{SAMPLE_SLUG}.txt"
        if sample_path.exists():
            html = text_to_html(sample_path.read_text(encoding="utf-8"))
            print(html[:3000])
            print(f"\n... ({len(html)} bytes total)")
        else:
            print(f"sample not found: {sample_path}")
        print("\n--apply 로 실행하면 32개 모두 변환 + DB update.")
        return

    print(f"\n[DB update] supabase: {SUPABASE_URL}")
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    for tp in txt_files:
        slug = tp.stem
        html = text_to_html(tp.read_text(encoding="utf-8"))
        # 백업도 갱신
        (SCRAPE_DIR / f"{slug}.html").write_text(html, encoding="utf-8")
        res = sb.table("courses").update({"description": html}).eq("slug", slug).execute()
        print(f"  {slug}: {len(res.data or [])} row(s), {len(html)} bytes")
    print("[done]")


if __name__ == "__main__":
    main()
