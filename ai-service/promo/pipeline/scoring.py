# -*- coding: utf-8 -*-
"""pr-publish scripts/score.py 실행·출력 파싱 (코드 지표).

score.py의 출력 형식은 tests/수동테스트.md V3에 실측 기록해 두었다.
섹션(=== naver.md === / === post.md ===)별로:
  차단 검사: 통과|차단  (+ "  X …" 실패 줄)
  검색 노출: N.N / 5.0  (naver.md만)
  중복 문단: 없음|N건    (+ "  - …" 줄)
  문체 지표: … 상투어 N · 헤징 N  (+ "  - …" 경고 줄)
"""

import re

from .config import cfg_get, prpub_root
from .errors import StageError
from .procs import run_cmd


def run_score(cfg, slug: str, out_dir, log) -> dict:
    """scripts/score.py를 실행해 파싱 결과(+raw 원문)를 돌려준다. 실패 시 StageError."""
    cmd = ["uv", "run", "python", "scripts/score.py", f"out/{slug}"]
    timeout = int(cfg_get(cfg, "prpub.score_timeout_sec", 120))
    res = run_cmd(cmd, cwd=prpub_root(cfg), timeout_sec=timeout, log=log)
    if res.error or res.timed_out or res.returncode != 0:
        raise StageError(
            "score.py 실행 실패",
            slug=slug,
            stage="judge",
            detail=res.error or res.stderr[:300] or f"rc={res.returncode}",
        )
    parsed = parse_score_output(res.stdout)
    parsed["raw"] = res.stdout
    return parsed


def parse_score_output(text: str) -> dict:
    """score.py 출력 텍스트를 섹션(naver/post)별 dict로 파싱한다.

    "  - " 부연 줄은 직전 항목(mode)에 따라 중복 문단/지표 경고로 분류한다.
    """
    result: dict = {}
    section = None
    mode = None  # "dups" | "style" | None — "  - " 줄이 어느 항목의 부연인지
    for line in text.splitlines():
        m = re.match(r"^=== (naver|post)\.md ===", line)
        if m:
            section = {
                "blocked": False,
                "blocking": [],
                "search": None,
                "dups": [],
                "style_notes": [],
                "cliche": 0,
                "hedge": 0,
                "metrics": "",
            }
            result[m.group(1)] = section
            mode = None
            continue
        if section is None:
            continue
        if line.startswith("차단 검사:"):
            section["blocked"] = "차단" in line
            mode = None
        elif line.startswith("  X "):
            section["blocking"].append(line[4:].strip())
        elif line.startswith("검색 노출:"):
            mm = re.search(r"([\d.]+)\s*/\s*5", line)
            if mm:
                section["search"] = float(mm.group(1))
            mode = "style"  # 이어지는 "  - " 줄은 검색 노출 감점 사유
        elif line.startswith("중복 문단:"):
            mode = "dups"
        elif line.startswith("문체 지표:"):
            section["metrics"] = line.replace("문체 지표:", "").strip()
            mm = re.search(r"상투어\s+(\d+)", line)
            if mm:
                section["cliche"] = int(mm.group(1))
            mm = re.search(r"헤징\s+(\d+)", line)
            if mm:
                section["hedge"] = int(mm.group(1))
            mode = "style"
        elif line.startswith("  - "):
            note = line[4:].strip()
            if mode == "dups":
                section["dups"].append(note)
            else:
                section["style_notes"].append(note)
    return result


def search_to_item4(cfg, search: float | None) -> int:
    """루브릭 3절 4번 환산: 4.0↑=2 / 2.5~3.5=1 / 2.0↓=0."""
    if search is None:
        return 0
    hi = float(cfg_get(cfg, "judge.search_item4_full", 4.0))
    mid = float(cfg_get(cfg, "judge.search_item4_half", 2.5))
    if search >= hi:
        return 2
    if search >= mid:
        return 1
    return 0


def all_blocking(parsed: dict) -> list[str]:
    """post/naver 두 섹션의 차단 항목 합집합 (중복 제거, 순서 유지)."""
    seen: list[str] = []
    for sec in ("post", "naver"):
        for item in parsed.get(sec, {}).get("blocking", []):
            tagged = f"[{sec}.md] {item}"
            if tagged not in seen:
                seen.append(tagged)
    return seen


def code_metrics_text(parsed: dict) -> str:
    """judge 프롬프트에 주입할 코드 지표 요약."""
    lines = []
    for sec in ("post", "naver"):
        s = parsed.get(sec)
        if not s:
            continue
        lines.append(f"### {sec}.md")
        lines.append(f"- 차단 검사: {'차단' if s['blocked'] else '통과'}")
        for b in s["blocking"]:
            lines.append(f"  - 차단: {b}")
        if s["search"] is not None:
            lines.append(f"- 검색 노출(코드 채점): {s['search']:.1f} / 5.0")
        lines.append(f"- 상투어 {s['cliche']}회 · 헤징 {s['hedge']}회")
        for d in s["dups"]:
            lines.append(f"- 중복 문단: {d}")
        for n in s["style_notes"]:
            lines.append(f"- 지표 경고: {n}")
    return "\n".join(lines)
