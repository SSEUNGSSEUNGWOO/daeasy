"""인사이트 발행 후 네이버 블로그(blog.naver.com/daeasy_official)에 **티저** 초안을 올린다.

- 네이버는 글쓰기 API 가 없어 pr-publish 의 `prpub naver <slug>` (로그인된 브라우저 세션으로 에디터 조작)를
  빌린다. 홍보발행 파이프라인과 같은 부품. `--publish` 는 절대 붙이지 않는다 — 에디터에 채워진 채 멈추고
  승우님이 '발행' 을 누른다.
- 티저 = 헤드라인 + 항목별 소제목·첫 문장 + 전문 링크. 사이트와 같은 글을 두 곳에 두면 네이버는
  canonical 을 안 봐서 어느 쪽이 밀릴지 모르고, 조회·좋아요·문의는 사이트에 있다.
- pr-publish 가 없는 PC(`PRPUB_ROOT` 미설정·폴더 없음)나 네이버 세션이 없으면 한 줄 남기고 건너뛴다.
  뉴스레터처럼 부가 기능 — 이게 실패해도 발행은 이미 끝난 상태다.
"""

import os
import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

import requests
import yaml

# 태그는 12~16개가 규격. 인사이트 태그(3~5개)에 이 풀을 앞에서부터 채운다
TAG_POOL = [
    "AI", "인공지능", "데이터", "공공기관", "AI교육", "데이터교육", "AI동향", "AI뉴스",
    "생성형AI", "AI리터러시", "데이지", "DAEASY", "AI챔피언", "공무원교육", "AI활용", "업무자동화",
]
TAG_MIN, TAG_MAX = 12, 16
TITLE_MAX = 60
# 무발행 모드는 본문 입력 후 10분 대기하고 스스로 종료한다 — 그보다 길게 (promo 와 동일)
NAVER_TIMEOUT_SEC = 1500

ITEM_RE = re.compile(r"^\s*\d+\.\s+###\s+(.+?)\s*$", re.M)


def prpub_root() -> Path | None:
    """`PRPUB_ROOT` 환경변수 → promo/config.yaml 의 prpub.root. 둘 다 없거나 폴더가 아니면 None."""
    root = os.environ.get("PRPUB_ROOT")
    if not root:
        cfg_path = Path(__file__).parent.parent / "promo" / "config.yaml"
        if cfg_path.exists():
            with open(cfg_path, encoding="utf-8") as f:
                root = (yaml.safe_load(f) or {}).get("prpub", {}).get("root")
    if not root:
        return None
    p = Path(root)
    return p if (p / "config.toml").exists() else None


def _plain(md: str) -> str:
    """마크다운 강조·링크를 벗긴 평문."""
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", md)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"\*(.+?)\*", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def _first_sentence(text: str) -> str:
    m = re.match(r"(.+?다\.)(?=\s|$)", text)
    return m.group(1) if m else text[:120]


def items(body: str) -> list[tuple[str, str]]:
    """본문의 번호 항목 → (소제목, 첫 문장). 헤드라인 다음의 첫 비어 있지 않은 줄을 문장으로 본다."""
    out: list[tuple[str, str]] = []
    heads = list(ITEM_RE.finditer(body))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(body)
        chunk = body[h.end():end]
        first = next((ln.strip() for ln in chunk.splitlines() if ln.strip() and not ln.strip().startswith("!")), "")
        out.append((h.group(1).strip(), _first_sentence(_plain(first))))
    return out


def _title(t: str) -> str:
    if len(t) <= TITLE_MAX:
        return t
    cut = t[:TITLE_MAX].rsplit(" ", 1)[0].rstrip(" ,—-·")
    return cut + "…"


def _tags(insight_tags: list[str]) -> list[str]:
    tags: list[str] = []
    for t in list(insight_tags) + TAG_POOL:
        t = t.replace(" ", "")
        if t and t not in tags:
            tags.append(t)
        if len(tags) >= TAG_MAX:
            break
    return tags[:TAG_MAX]


def build_naver_md(insight, site: str, category: str, has_cover: bool) -> str:
    date = datetime.strptime(insight.published_at[:10], "%Y-%m-%d")
    date_ko = f"{date.year}년 {date.month}월 {date.day}일"
    url = f"{site}/insights/{quote(insight.slug)}"
    its = items(insight.body)

    front = [
        "---",
        f"제목: {_title(insight.title)}",
        f"카테고리: {category}",
        f"태그: {', '.join(_tags(insight.tags))}",
    ]
    if has_cover:
        front.append("대표사진: images/cover.jpg")
    front.append("---")

    lines = []
    if has_cover:
        lines += ["[대표사진]", ""]
    lines += [
        f"{date_ko} 데이지 AI 인사이트입니다. 오늘 수집한 AI·데이터 동향 가운데 "
        f"업무에 AI 를 도입·활용하는 조직이 봐야 할 {len(its)}가지를 골랐습니다.",
        "",
    ]
    for n, (head, sent) in enumerate(its, 1):
        lines += [f"{n}. {head}", sent, ""]
    lines += [
        "각 항목의 배경과 에디터 코멘트, 실무 적용 가이드 전문은 데이지 인사이트에서 읽을 수 있습니다.",
        url,
        "",
    ]
    return "\n".join(front) + "\n\n" + "\n".join(lines)


def _download(url: str, dest: Path) -> bool:
    try:
        r = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        return True
    except Exception as e:
        print(f"[naver] 커버 이미지 다운로드 실패 — 사진 없이 진행: {e}")
        return False


def draft(insight) -> None:
    root = prpub_root()
    if root is None:
        print("[naver] pr-publish 없음 (PRPUB_ROOT 미설정 또는 폴더 아님) — 네이버 초안 생략")
        return
    if not (root / ".naver-profile").exists():
        print("[naver] 네이버 세션 없음 — pr-publish 에서 `uv run prpub naver-login` 후 재실행하면 초안 생성")
        return
    site = os.environ.get("NEXT_PUBLIC_SITE_URL")
    if not site:
        print("[naver] NEXT_PUBLIC_SITE_URL 미설정 — 전문 링크를 만들 수 없어 생략")
        return

    out_dir = root / "out" / insight.slug
    out_dir.mkdir(parents=True, exist_ok=True)
    has_cover = bool(insight.image_url) and _download(insight.image_url, out_dir / "images" / "cover.jpg")
    category = os.environ.get("NAVER_INSIGHT_CATEGORY", "AI 인사이트")
    (out_dir / "naver.md").write_text(build_naver_md(insight, site, category, has_cover), encoding="utf-8")
    print(f"[naver] naver.md 생성: {out_dir}")

    uv = shutil.which("uv") or "uv"
    args = [uv, "run", "prpub", "naver", insight.slug]  # --publish 절대 금지 — 사람이 발행 버튼을 누른다
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    env.update({"PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})
    try:
        res = subprocess.run(
            args, cwd=root, capture_output=True, text=True, encoding="utf-8",
            timeout=NAVER_TIMEOUT_SEC, env=env, shell=True,
        )
    except subprocess.TimeoutExpired:
        # 무발행 모드는 대기 후 스스로 종료하지만, 미리보기가 남았으면 본문 입력은 끝난 것 (promo F6 과 동일)
        if (out_dir / "naver_미리보기1.png").exists():
            print("[naver] 에디터에 채워둠 (타임아웃, 미리보기 있음) — 블로그에서 확인 후 발행")
        else:
            print("[naver] 타임아웃 — 미리보기 없음. pr-publish 에서 `uv run prpub naver <slug>` 로 직접 확인")
        return
    if res.returncode == 0:
        print("[naver] 에디터에 채워둠 — 블로그에서 확인 후 발행")
    else:
        tail = (res.stderr or res.stdout or "")[-300:].strip()
        print(f"[naver] prpub naver 실패: {tail}")


if __name__ == "__main__":
    # 자체 체크: 본문 → 항목·첫 문장 추출, frontmatter 규격(태그 12~16, 제목 60자), 사진 유무에 따른 자리표시
    from types import SimpleNamespace

    body = (
        "## 핵심 인사이트\n\n![source-image](https://x/a.png)\n\n"
        "1. ### 에이전트 보안 공백\n\n   **오픈AI**가 [사건](https://t.co)을 인정했다. 두 번째 문장이다.\n\n"
        "   **에디터 코멘트:** *…*\n\n---\n\n"
        "2. ### 연구 자동화 지표\n\n   메타는 속도를 1.6배 끌어올렸다고 밝혔다. 다음.\n"
    )
    ins = SimpleNamespace(
        title="A" * 70, body=body, slug="2026-09-09-테스트", published_at="2026-09-09",
        tags=["보안", "정책", "산업 적용"], image_url="https://x/c.jpg",
    )
    md = build_naver_md(ins, "https://daeasy.co.kr", "AI 인사이트", has_cover=True)
    assert md.startswith("---\n제목: " + "A" * 60 + "…\n"), md[:80]
    tag_line = next(ln for ln in md.splitlines() if ln.startswith("태그: "))
    n_tags = len(tag_line[4:].split(", "))
    assert TAG_MIN <= n_tags <= TAG_MAX, n_tags
    assert "산업적용" in tag_line and "대표사진: images/cover.jpg" in md and "[대표사진]" in md
    assert "1. 에이전트 보안 공백\n오픈AI가 사건을 인정했다.\n" in md, md
    assert "2. 연구 자동화 지표\n메타는 속도를 1.6배 끌어올렸다고 밝혔다.\n" in md, md
    assert md.rstrip().endswith("https://daeasy.co.kr/insights/2026-09-09-%ED%85%8C%EC%8A%A4%ED%8A%B8")
    md2 = build_naver_md(ins, "https://daeasy.co.kr", "AI 인사이트", has_cover=False)
    assert "대표사진" not in md2
    print("OK")
