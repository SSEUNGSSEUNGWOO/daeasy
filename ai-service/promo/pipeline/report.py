# -*- coding: utf-8 -*-
"""최종 산출 — 실행 보고서 md (output/).

건별: 단계 상태표 · 항목별 점수/루프 이력(사이클 영속값 포함) · draft 결과(링크·
stale 경고·skipped 안내) · 스킵/실패 사유. 접수 제외 건은 등록자 전달용 수정
요청 문구와 함께 담는다.
"""

from datetime import datetime

from .config import cfg_get, out_dir_of
from .stages.judge import ITEM_NAMES
from . import state as st

STAGE_ORDER = ("intake", "research", "write", "judge", "review", "draft")
STATUS_KO = {
    "done": "완료", "pending": "대기", "failed": "실패", "stalled": "정체 중단",
    "ok": "완료(draft)", "draft_ready": "완료(draft·타임아웃 종료)",
    "already_exists": "완료(기존 draft 동일 본문)",
    "already_exists_stale": "수동 확인 대기(기존 draft가 구버전)",
    "skipped": "스킵(세션 없음)",
}


def _stage_table(state: dict) -> list[str]:
    """건별 단계 상태표(md 테이블) 줄 목록 — 5.5 재판정·draft 채널 행 포함."""
    lines = ["| 단계 | 상태 | 상세 |", "|---|---|---|"]
    for stage in STAGE_ORDER[:-1]:
        s = state["stages"].get(stage, {})
        status = s.get("status", "-")
        lines.append(f"| {stage} | {STATUS_KO.get(status, status)} | {s.get('detail', '')} |")
    q = state.get("quality", {})
    lines.append(
        f"| 5.5 최종 재판정 | {'통과' if q.get('passed') else '미통과'} | "
        f"{q.get('at', '')} · 사이클 {st.get_cycle(state)} |"
    )
    for ch in ("site", "naver"):
        d = state.get("draft", {}).get(ch, {})
        status = d.get("status", "-")
        lines.append(f"| draft:{ch} | {STATUS_KO.get(status, status)} | {d.get('detail', '')} |")
    return lines


def _judge_history(state: dict) -> list[str]:
    """judge 루프·5.5 최종 재판정의 채점 이력 테이블 줄 목록. 이력 없으면 빈 목록."""
    hist = state.get("history", {}).get("judge", [])
    final = state.get("history", {}).get("final", [])
    if not hist and not final:
        return []
    lines = ["", "#### 채점 이력 (judge 루프 · 5.5 최종 재판정)", "",
             "| 구분 | 사이클 | 라운드 | 총점 | 항목별 (1~7) | 제목 | 차단 |",
             "|---|---|---|---|---|---|---|"]
    for kind, rows in (("judge", hist), ("5.5", final)):
        for h in rows:
            items = h.get("items", {})
            item_str = " ".join(f"{k}:{items[k]}" for k in sorted(items, key=int))
            lines.append(
                f"| {kind} | {h.get('cycle', '?')} | {h.get('round', '?')} "
                f"| {h.get('total', '?')}/14{' (본문 이어받음)' if h.get('carried_over') else ''} | {item_str} "
                f"| {'통과' if h.get('title_pass') else '불통과'} "
                f"| {len(h.get('blocking', []))}건 |"
            )
    return lines


def _review_history(state: dict) -> list[str]:
    """형식 검토(review) 라운드별 통과/FAIL 이력 줄 목록. 이력 없으면 빈 목록."""
    hist = state.get("history", {}).get("review", [])
    if not hist:
        return []
    lines = ["", "#### 형식 검토 이력", ""]
    for h in hist:
        lines.append(
            f"- 사이클 {h.get('cycle', '?')} 라운드 {h.get('round', '?')}: "
            + ("통과" if h.get("passed") else f"FAIL {h.get('fails', '?')}건")
        )
    return lines


def _draft_section(state: dict, out_dir, admin_url: str) -> list[str]:
    """채널별 draft 결과 + 확인 링크(어드민 URL·미리보기) + 무발행 고지 줄 목록."""
    lines = ["", "#### 발행 준비 결과", ""]
    for ch, label in (("site", "daeasy 사이트"), ("naver", "네이버 블로그")):
        d = state.get("draft", {}).get(ch, {})
        status = d.get("status", "-")
        lines.append(f"- **{label}**: {STATUS_KO.get(status, status)}")
        if d.get("detail"):
            lines.append(f"  - {d['detail']}")
        if ch == "site" and status in ("ok", "already_exists", "already_exists_stale"):
            lines.append(f"  - 확인: {admin_url}")
        if ch == "naver" and status in ("ok", "draft_ready"):
            lines.append(f"  - 미리보기: {out_dir / 'naver_미리보기1.png'}")
    lines.append("")
    lines.append("> 실제 발행(`--publish`/`--live`)은 이 파이프라인이 절대 실행하지 않습니다. "
                 "사람이 확인한 뒤 pr-publish에서 직접 실행하세요.")
    return lines


def write_report(cfg, slugs: list[str], failures: list[dict],
                 run_errors: dict[str, str], log) -> "str":
    """실행 보고서 md를 output/에 저장하고 그 경로를 돌려준다.

    접수 제외 건(등록자 전달 문구 포함) → 건별 결과(상태표·이력·draft 결과·
    중단 사유) → 항목 이름 참조 순으로 구성한다.
    """
    admin_url = cfg_get(cfg, "prpub.admin_url", "")
    out_root = cfg["paths"]["output_dir"]
    out_root.mkdir(parents=True, exist_ok=True)
    now = datetime.now()
    path = out_root / f"실행보고서_{now:%Y-%m-%d_%H%M%S}.md"

    lines = [
        "# 홍보발행 파이프라인 실행 보고서",
        "",
        f"- 실행 시각: {now:%Y-%m-%d %H:%M:%S}",
        f"- 처리 대상: {len(slugs)}건 · 접수 제외: {len(failures)}건",
        "",
    ]

    if failures:
        lines += ["## 접수 제외 건 (등록자 수정 요청)", ""]
        for f in failures:
            errs = "; ".join(f.get("errors", []))
            lines.append(f"- **{f['folder']}** — {errs}")
            lines.append(f"  - 전달 문구: \"{f['folder']} 접수건에서 다음을 보완해 다시 넣어 주세요: {errs}\"")
        lines.append("")

    lines += ["## 건별 결과", ""]
    if not slugs:
        lines.append("(처리 대상 없음)")
    for slug in slugs:
        state = st.load_state(cfg, slug)
        out_dir = out_dir_of(cfg, slug)
        lines += [f"### {slug}", ""]
        if slug in run_errors:
            lines += [f"> ⚠️ 이번 실행 중단 사유: {run_errors[slug]}", ""]
        lines += _stage_table(state)
        lines += _judge_history(state)
        lines += _review_history(state)
        lines += _draft_section(state, out_dir, admin_url)
        lines.append("")

    lines += [
        "## 항목 이름 참조",
        "",
        "- " + " · ".join(f"{k} {v}" for k, v in ITEM_NAMES.items()),
        "",
    ]

    path.write_text("\n".join(lines), encoding="utf-8")
    log.info("실행 보고서 저장: %s", path)
    return str(path)
