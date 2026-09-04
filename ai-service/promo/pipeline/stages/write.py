# -*- coding: utf-8 -*-
"""3단계 글 작성(라이터) + 재작성(리라이터).

- writer: brief·research·사진을 취합해 insight.md → photos.md → post.md·naver.md.
  발견 한 줄(insight)을 못 채우면 post/naver를 만들지 않고 멈춘다 (루브릭 1절).
- run_rewrite: judge/review/final_judge가 지정한 타깃만 외과적으로 고친다.
  재작성 후 해시 대장(write 단계 기록)을 갱신한다 — 수동 편집 감지(E22)의 기준.
"""

import json

from ..claude_cli import call_claude
from ..errors import StageError
from ..prompts import headline_rules, images_list, load_prompt, read_out_file, render, writing_spec
from .. import state as st


def run_write(cfg, slug: str, out_dir, state: dict, log) -> None:
    """3단계 글 작성 — writer 호출로 insight·photos·post·naver 4파일을 만든다.

    done이면 스킵. 산출 파일이 빠지면 failed 기록 후 StageError
    (insight '발견-실패'로 멈춘 경우 그 사유를 detail에 담는다).
    """
    if st.is_stage_done(cfg, state, "write", out_dir):
        log.info("[%s] write 완료 — 스킵", slug)
        return

    prompt = render(
        load_prompt(cfg, "writer"),
        slug=slug,
        out_dir=str(out_dir),
        brief=read_out_file(out_dir, "brief.md"),
        research=read_out_file(out_dir, "research.md") or "(research.md 없음 — 외부 자료 없이 쓴다)",
        meta=read_out_file(out_dir, "meta.json"),
        images_list=images_list(out_dir),
        spec_5=writing_spec(cfg),
        headline_rules=headline_rules(cfg),
    )
    call_claude(cfg, "writer", prompt, log, slug=slug)

    missing = [f for f in st.WRITE_FILES if not (out_dir / f).exists()]
    if missing:
        # insight를 못 채워 멈춘 경우 post/naver가 없는 것이 정상 경로다 — 사유를 보고
        insight = read_out_file(out_dir, "insight.md")
        detail = f"미생성 파일: {', '.join(missing)}"
        if insight and "발견-실패" in insight:
            detail = f"발견 한 줄 실패 — {insight[:300]}"
        st.mark_stage(state, "write", "failed", detail)
        st.save_state(cfg, state)
        raise StageError("write 미완 — " + detail, slug=slug, stage="write", detail=detail)

    st.mark_stage(state, "write", "done")
    st.record_file_hashes(state, "write", out_dir)
    st.save_state(cfg, state)
    log.info("[%s] write done (insight·photos·post·naver)", slug)


def run_rewrite(cfg, slug: str, out_dir, targets: list[dict], log, state: dict | None = None) -> None:
    """깎인 항목만 지정해 재작성한다. 호출 전에 상태 전이가 영속화되어 있어야 한다 (C24).

    state를 받으면 재작성 직후 write 단계 해시 대장을 갱신·저장한다 —
    파이프라인이 아는 최신 파일 상태를 남겨 수동 편집(E22) 감지의 기준이 된다.
    """
    if not targets:
        return
    prompt = render(
        load_prompt(cfg, "rewriter"),
        slug=slug,
        out_dir=str(out_dir),
        targets=json.dumps(targets, ensure_ascii=False, indent=2),
        brief=read_out_file(out_dir, "brief.md"),
        research=read_out_file(out_dir, "research.md"),
        insight=read_out_file(out_dir, "insight.md"),
        headline_rules=headline_rules(cfg),
        images_list=images_list(out_dir),
    )
    call_claude(cfg, "rewriter", prompt, log, slug=slug)
    if state is not None:
        st.record_file_hashes(state, "write", out_dir)
        st.save_state(cfg, state)
    log.info("[%s] rewrite 수행 (타깃 %d개: %s)", slug, len(targets),
             ", ".join(t.get("origin", "?") for t in targets))
