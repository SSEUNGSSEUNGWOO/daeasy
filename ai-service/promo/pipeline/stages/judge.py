# -*- coding: utf-8 -*-
"""4단계 LLM-as-judge 정량평가 + 5.5단계 최종 재판정에 쓰이는 공통 로직.

설계 근거(docs/루브릭-근거.md):
- 항목별 분리 채점 + 근거 서술(CoT) 후 점수 + JSON 강제 — G-Eval (Liu et al. 2023)
- 판정은 LLM이 아니라 이 코드가 한다: JSON 점수 파싱 → 기준점(12/14)·거부권
  (항목1=0)·차단 검사·제목 심사로 통과/불통과 결정
- 항목4(검색 노출)는 scripts/score.py 코드 점수를 환산한다 — LLM에 맡기지 않는다
- 정체 감지: 총점이 stall_rounds(기본 2)회 연속 오르지 않으면 중단·보고
"""

from ..claude_cli import call_claude_json
from ..config import cfg_get
from ..errors import StageError, StalledError
from ..prompts import load_prompt, read_out_file, render
from ..scoring import all_blocking, code_metrics_text, run_score, search_to_item4
from .. import state as st
from .write import run_rewrite

# LLM이 매기는 항목 (4번 검색 노출은 코드 환산)
LLM_ITEMS = (1, 2, 3, 5, 6, 7)
ITEM_NAMES = {
    1: "대체 불가능성", 2: "출처 추적성", 3: "현장 증거", 4: "검색 노출",
    5: "사람 문체", 6: "군더더기 없음", 7: "구성",
}

JUDGE_SCHEMA_HINT = (
    '{"items": [{"id": 1, "evidence": "근거 서술", "score": 0|1|2}, … (id 1,2,3,5,6,7)], '
    '"title": {"pass": true|false, "reasons": ["불통과 사유"]}}'
)

# 깎인 항목별 수정 범위 (홍보발행.md 6-1 "어디까지 고칠 것인가" 표)
FIX_SCOPE = {
    1: "대체 불가능성 0점은 뼈대 문제 — 이 경우에만 전체 재작성. 1점이면 이 회차에만 있는 사실을 brief·research 안에서 보강",
    2: "출처를 짚지 못하는 그 문장만 고치거나 뺀다. 주변 문단은 건드리지 않는다",
    3: "재료 부족 — brief·research에 있는 실습 장면·반응·산출물만 보강. 원자료에 없는 장면을 지어내지 않는다",
    4: "첫 문단·소제목·태그·링크만 손본다 (naver.md 중심). 분량을 늘리려 문단을 붙이지 않는다",
    5: "상투어·헤징·과하게 꾸민 그 문장만 고쳐 쓴다",
    6: "빼도 되는 그 문단만 삭제한다. 같은 내용 반복 제거",
    7: "소제목만 고치거나 그 문단을 맞는 절로 옮긴다",
}


def run_judge_once(cfg, slug: str, out_dir, log) -> dict:
    """score.py + LLM 채점 1회 → verdict. 통과/불통과 판정은 코드가 한다."""
    parsed = run_score(cfg, slug, out_dir, log)
    blocking = all_blocking(parsed)
    naver_search = parsed.get("naver", {}).get("search")
    item4 = search_to_item4(cfg, naver_search)

    prompt = render(
        load_prompt(cfg, "judge"),
        slug=slug,
        brief=read_out_file(out_dir, "brief.md"),
        research=read_out_file(out_dir, "research.md"),
        insight=read_out_file(out_dir, "insight.md"),
        post=read_out_file(out_dir, "post.md"),
        naver=read_out_file(out_dir, "naver.md"),
        code_metrics=code_metrics_text(parsed),
    )
    obj = call_claude_json(cfg, "judge", prompt, log, slug=slug, schema_hint=JUDGE_SCHEMA_HINT)

    items: dict[int, int] = {}
    evidence: dict[int, str] = {}
    for it in obj.get("items", []):
        try:
            iid = int(it.get("id"))
            score = int(it.get("score"))
        except (TypeError, ValueError):
            continue
        if iid in LLM_ITEMS and score in (0, 1, 2):
            items[iid] = score
            evidence[iid] = str(it.get("evidence", ""))[:500]
    missing = [i for i in LLM_ITEMS if i not in items]
    if missing:
        raise StageError(
            f"judge 응답에 항목 누락: {missing}", slug=slug, stage="judge",
            detail=str(obj)[:500],
        )
    items[4] = item4
    evidence[4] = f"score.py 검색 노출 {naver_search} → {item4}점 환산"

    title = obj.get("title", {}) or {}
    title_pass = bool(title.get("pass", False))
    title_reasons = [str(r) for r in (title.get("reasons") or [])]

    total = sum(items.values())
    pass_score = int(cfg_get(cfg, "judge.pass_score", 12))
    passed = (not blocking) and total >= pass_score and items[1] > 0 and title_pass

    return {
        "passed": passed,
        "total": total,
        "items": {str(k): v for k, v in sorted(items.items())},
        "evidence": {str(k): v for k, v in sorted(evidence.items())},
        "blocking": blocking,
        "title_pass": title_pass,
        "title_reasons": title_reasons,
        "search": naver_search,
    }


def verdict_to_targets(verdict: dict, origin: str) -> list[dict]:
    """불통과 verdict → 깎인 항목만 지정한 FixTarget 목록.

    origin: "judge" | "final_judge" — final_judge 타깃은 재작성 후 반드시
    judge 루프를 다시 통과해야 한다 (D15 불변식, C16).
    """
    targets: list[dict] = []
    for b in verdict.get("blocking", []):
        targets.append({
            "origin": f"{origin}_blocking",
            "what": f"차단 검사 위반: {b}",
            "scope": "그 문장·그 자리만 고친다. 근거 없는 숫자·인용은 뺀다",
        })
    for key, score in verdict.get("items", {}).items():
        iid = int(key)
        if score >= 2:
            continue
        targets.append({
            "origin": f"{origin}_item{iid}",
            "what": f"항목 {iid}({ITEM_NAMES[iid]}) {score}점: {verdict.get('evidence', {}).get(key, '')}",
            "scope": FIX_SCOPE.get(iid, "깎인 곳만 고친다"),
        })
    if not verdict.get("title_pass", True):
        targets.append({
            "origin": f"{origin}_title",
            "what": "제목 불통과: " + "; ".join(verdict.get("title_reasons", [])),
            "scope": "제목만 고친다. 헤드라인 규칙 절차대로 재작성 — 본문 문장을 옮기지 말고 의미로 재구성",
        })
    return targets


def _stalled(totals: list[int], stall_rounds: int) -> bool:
    """직전 값 대비 상승이 stall_rounds회 연속 없으면 정체."""
    if len(totals) < stall_rounds + 1:
        return False
    return all(totals[-i] <= totals[-i - 1] for i in range(1, stall_rounds + 1))


def run_judge_loop(cfg, slug: str, out_dir, state: dict, log) -> None:
    """4단계 judge 루프 — 통과할 때까지 채점→타깃 재작성 반복."""
    if st.is_stage_done(cfg, state, "judge", out_dir):
        log.info("[%s] judge 완료(해시 일치) — 스킵", slug)
        return

    max_rounds = int(cfg_get(cfg, "judge.max_rounds", 5))
    stall_rounds = int(cfg_get(cfg, "judge.stall_rounds", 2))
    cycle = st.get_cycle(state)
    totals: list[int] = []

    for rnd in range(1, max_rounds + 1):
        verdict = run_judge_once(cfg, slug, out_dir, log)
        state["history"]["judge"].append({"cycle": cycle, "round": rnd, **verdict})
        st.save_state(cfg, state)
        log.info(
            "[%s] judge 사이클%d 라운드%d: 총점 %d/14 · 차단 %d건 · 제목 %s",
            slug, cycle, rnd, verdict["total"], len(verdict["blocking"]),
            "통과" if verdict["title_pass"] else "불통과",
        )

        if verdict["passed"]:
            st.mark_stage(state, "judge", "done", f"사이클{cycle} 라운드{rnd} 통과 ({verdict['total']}/14)")
            st.record_file_hashes(state, "judge", out_dir)
            st.save_state(cfg, state)
            return

        totals.append(verdict["total"])
        if _stalled(totals, stall_rounds):
            st.mark_stage(state, "judge", "stalled", f"점수 정체: {totals}")
            st.save_state(cfg, state)
            raise StalledError(
                f"judge 점수 정체 — {stall_rounds}회 연속 미상승 ({totals})",
                slug=slug, stage="judge", detail=str(totals),
            )
        if rnd == max_rounds:
            break
        targets = verdict_to_targets(verdict, "judge")
        run_rewrite(cfg, slug, out_dir, targets, log, state=state)

    st.mark_stage(state, "judge", "failed", f"상한 {max_rounds}회 도달 · 점수 이력 {totals}")
    st.save_state(cfg, state)
    raise StageError(
        f"judge 루프 상한({max_rounds}회) 도달 — 점수 이력 {totals}",
        slug=slug, stage="judge", detail=str(totals),
    )
