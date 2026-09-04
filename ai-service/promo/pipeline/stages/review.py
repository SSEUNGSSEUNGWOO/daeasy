# -*- coding: utf-8 -*-
"""5단계 형식 검토(리뷰어) 루프.

- 사실 대조(brief·research에 근거 없는 문장), 사진 중복·대표사진 규칙,
  naver.md의 태그(12~16)·링크카드·맺음 블록 형식을 점검한다.
- FAIL 항목은 코드가 파싱해 수정 루프를 돈다 (judge와 같은 정체 감지).
- FAIL 0건이어도 차단 검사(score.py)를 재확인하고, 새 차단이 나오면 그것을
  타깃으로 변환해 루프를 계속한다 (C3 — 미정의 경로 제거).
"""

from ..claude_cli import call_claude_json
from ..config import cfg_get
from ..errors import StageError, StalledError
from ..prompts import images_list, load_prompt, read_out_file, render
from ..scoring import all_blocking, run_score
from .. import state as st
from .write import run_rewrite

REVIEW_SCHEMA_HINT = (
    '{"fails": [{"code": "fact|photo|format", "where": "파일·위치", '
    '"detail": "무엇이 문제인가", "fix_hint": "어떻게 고칠까"}]}'
)


def run_review_once(cfg, slug: str, out_dir, log) -> list[dict]:
    """reviewer 1회 호출 → FAIL 항목 dict 목록. fails 배열이 없으면 StageError."""
    prompt = render(
        load_prompt(cfg, "reviewer"),
        slug=slug,
        brief=read_out_file(out_dir, "brief.md"),
        research=read_out_file(out_dir, "research.md"),
        insight=read_out_file(out_dir, "insight.md"),
        photos=read_out_file(out_dir, "photos.md"),
        post=read_out_file(out_dir, "post.md"),
        naver=read_out_file(out_dir, "naver.md"),
        images_list=images_list(out_dir),
    )
    obj = call_claude_json(cfg, "reviewer", prompt, log, slug=slug, schema_hint=REVIEW_SCHEMA_HINT)
    fails = obj.get("fails")
    if not isinstance(fails, list):
        raise StageError("reviewer 응답에 fails 배열이 없음", slug=slug, stage="review",
                         detail=str(obj)[:500])
    return [f for f in fails if isinstance(f, dict)]


def _stalled(counts: list[int], stall_rounds: int) -> bool:
    """FAIL 건수가 stall_rounds회 연속 줄지 않으면 정체."""
    if len(counts) < stall_rounds + 1:
        return False
    return all(counts[-i] >= counts[-i - 1] for i in range(1, stall_rounds + 1))


def run_review_loop(cfg, slug: str, out_dir, state: dict, log) -> None:
    """5단계 review 루프 — FAIL 0건(+차단 0건)까지 검토→타깃 재작성 반복.

    정체(stall_rounds회 연속 미감소)면 StalledError, 상한 도달이면 StageError.
    """
    if st.is_stage_done(cfg, state, "review", out_dir):
        log.info("[%s] review 완료(해시 일치) — 스킵", slug)
        return

    max_rounds = int(cfg_get(cfg, "review.max_rounds", 5))
    stall_rounds = int(cfg_get(cfg, "review.stall_rounds", 2))
    cycle = st.get_cycle(state)
    counts: list[int] = []

    for rnd in range(1, max_rounds + 1):
        fails = run_review_once(cfg, slug, out_dir, log)
        blocking_targets: list[dict] = []

        if not fails:
            # C3: FAIL 0건이면 차단 검사를 재확인 — 새 차단이 있으면 타깃으로 계속
            parsed = run_score(cfg, slug, out_dir, log)
            blocking = all_blocking(parsed)
            if not blocking:
                st.mark_stage(state, "review", "done", f"사이클{cycle} 라운드{rnd} 통과")
                st.record_file_hashes(state, "review", out_dir)
                state["history"]["review"].append(
                    {"cycle": cycle, "round": rnd, "fails": 0, "passed": True})
                st.save_state(cfg, state)
                log.info("[%s] review 사이클%d 라운드%d 통과", slug, cycle, rnd)
                return
            blocking_targets = [{
                "origin": "review_blocking",
                "what": f"차단 검사 위반: {b}",
                "scope": "그 문장·그 자리만 고친다. 근거 없는 숫자·인용은 뺀다",
            } for b in blocking]
            log.warning("[%s] review FAIL 0건이지만 차단 %d건 재발견", slug, len(blocking))

        n_fail = len(fails) + len(blocking_targets)
        counts.append(n_fail)
        state["history"]["review"].append(
            {"cycle": cycle, "round": rnd, "fails": n_fail, "passed": False,
             "items": fails[:20]})
        st.save_state(cfg, state)
        log.info("[%s] review 사이클%d 라운드%d: FAIL %d건", slug, cycle, rnd, n_fail)

        if _stalled(counts, stall_rounds):
            st.mark_stage(state, "review", "stalled", f"FAIL 건수 정체: {counts}")
            st.save_state(cfg, state)
            raise StalledError(
                f"review 정체 — FAIL 건수 {stall_rounds}회 연속 미감소 ({counts})",
                slug=slug, stage="review", detail=str(counts),
            )
        if rnd == max_rounds:
            break

        targets = blocking_targets + [{
            "origin": f"review_{f.get('code', 'format')}",
            "what": f"{f.get('where', '')}: {f.get('detail', '')}",
            "scope": f.get("fix_hint", "지적된 곳만 고친다"),
        } for f in fails]
        run_rewrite(cfg, slug, out_dir, targets, log, state=state)

    st.mark_stage(state, "review", "failed", f"상한 {max_rounds}회 도달 · FAIL 이력 {counts}")
    st.save_state(cfg, state)
    raise StageError(
        f"review 루프 상한({max_rounds}회) 도달 — FAIL 이력 {counts}",
        slug=slug, stage="review", detail=str(counts),
    )
