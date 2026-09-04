# -*- coding: utf-8 -*-
"""4단계 LLM-as-judge 정량평가 + 5.5단계 최종 재판정에 쓰이는 공통 로직.

설계 근거(docs/루브릭-근거.md):
- 항목별 분리 채점 + 근거 서술(CoT) 후 점수 + JSON 강제 — G-Eval (Liu et al. 2023)
- 판정은 LLM이 아니라 이 코드가 한다: JSON 점수 파싱 → 기준점(12/14)·거부권
  (항목1=0)·차단 검사·제목 심사로 통과/불통과 결정
- 항목4(검색 노출)는 scripts/score.py 코드 점수를 환산한다 — LLM에 맡기지 않는다
- 정체 감지: 총점이 stall_rounds(기본 2)회 연속 오르지 않으면 중단·보고
- 제목만 재작성한 라운드는 본문이 그대로이므로 LLM 본문 항목 점수를 직전 라운드에서
  이어받는다 — 같은 글을 라운드마다 다르게 채점하는 judge 편차를 코드로 막는다
"""

import hashlib
import re

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


def body_hash(out_dir) -> str:
    """제목을 뺀 본문의 해시 — post.md 첫 `# ` 줄, naver.md `제목:` 줄만 제외한다."""
    post = re.sub(r"\A#[^\n]*\n", "", read_out_file(out_dir, "post.md"), count=1)
    naver = re.sub(r"^제목:[^\n]*\n", "", read_out_file(out_dir, "naver.md"), count=1, flags=re.M)
    return hashlib.sha256((post + "\n\x00\n" + naver).encode("utf-8")).hexdigest()


def read_title(out_dir) -> str:
    """post.md 첫 `# ` 줄의 제목. 없으면 빈 문자열."""
    m = re.match(r"#\s*([^\n]*)", read_out_file(out_dir, "post.md"))
    return m.group(1).strip() if m else ""


def restore_title(out_dir, title: str) -> None:
    """post.md 첫 줄과 naver.md `제목:` 을 확정 제목으로 되돌린다 (본문 재작성이 제목을 건드린 경우)."""
    post = out_dir / "post.md"
    text = post.read_text(encoding="utf-8")
    post.write_text(re.sub(r"\A#[^\n]*", f"# {title}", text, count=1), encoding="utf-8")
    naver = out_dir / "naver.md"
    if naver.exists():
        text = naver.read_text(encoding="utf-8")
        naver.write_text(re.sub(r"^제목:[^\n]*", f"제목: {title}", text, count=1, flags=re.M), encoding="utf-8")


def carry_over_body_items(cfg, verdict: dict, prev: dict) -> dict:
    """본문이 그대로일 때 LLM 본문 항목(1·2·3·5·6·7)을 직전 verdict에서 이어받는다.

    새로 반영하는 것은 제목 판정·차단 검사·코드 환산 항목4뿐이다. 판정은 다시 계산한다.
    """
    items = dict(verdict["items"])
    evidence = dict(verdict["evidence"])
    for iid in LLM_ITEMS:
        key = str(iid)
        items[key] = prev["items"][key]
        evidence[key] = prev["evidence"].get(key, "")
    total = sum(items.values())
    pass_score = int(cfg_get(cfg, "judge.pass_score", 12))
    score_ok = total >= pass_score and items["1"] > 0
    return {
        **verdict,
        "items": items,
        "evidence": evidence,
        "total": total,
        "score_ok": score_ok,
        "passed": (not verdict["blocking"]) and score_ok and verdict["title_pass"],
        "carried_over": True,
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
    score_ok = total >= pass_score and items[1] > 0
    passed = (not blocking) and score_ok and title_pass

    return {
        "passed": passed,
        "score_ok": score_ok,
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

    총점이 이미 통과선을 넘었으면(score_ok) 1점짜리 항목은 통과를 막는 게 아니므로
    타깃에서 뺀다 — 본문을 건드려 멀쩡한 항목이 회귀하는 것을 막는다. 그때는
    차단 위반·제목만 남는다.
    """
    targets: list[dict] = []
    for b in verdict.get("blocking", []):
        targets.append({
            "origin": f"{origin}_blocking",
            "what": f"차단 검사 위반: {b}",
            "scope": "그 문장·그 자리만 고친다. 근거 없는 숫자·인용은 뺀다",
        })
    items = {} if verdict.get("score_ok") else verdict.get("items", {})
    for key, score in items.items():
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
            "scope": "제목만 고친다. 헤드라인 규칙 절차대로 재작성 — 본문 문장을 옮기지 말고 의미로 재구성. "
                     "검색 노출(항목4)이 제목 키워드에 걸리므로 기관명·과정명은 제목에 유지한다",
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
    prev_verdict: dict | None = None
    title_only_hash: str | None = None  # 직전 재작성이 제목만이었을 때의 본문 해시
    locked_title: str | None = None  # 한 번 통과한 제목은 확정 — 본문이 바뀌어도 다시 심사하지 않는다

    for rnd in range(1, max_rounds + 1):
        verdict = run_judge_once(cfg, slug, out_dir, log)
        if title_only_hash is not None and prev_verdict is not None and body_hash(out_dir) == title_only_hash:
            verdict = carry_over_body_items(cfg, verdict, prev_verdict)
            log.info("[%s] 본문 변경 없음(제목만 재작성) — 본문 항목 점수는 직전 라운드에서 이어받음", slug)
        title_only_hash = None
        if locked_title is not None and not verdict["title_pass"] and read_title(out_dir) == locked_title:
            verdict = {**verdict, "title_pass": True, "title_reasons": [], "title_locked": True,
                       "passed": (not verdict["blocking"]) and verdict["score_ok"]}
            log.info("[%s] 제목 확정 상태(이전 라운드 통과) — 제목 재판정 무시", slug)
        if verdict["title_pass"] and locked_title is None:
            locked_title = read_title(out_dir)
            log.info("[%s] 제목 확정: %s", slug, locked_title)
        prev_verdict = verdict
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
        if all(t["origin"] == "judge_title" for t in targets):
            title_only_hash = body_hash(out_dir)
        run_rewrite(cfg, slug, out_dir, targets, log, state=state)
        if locked_title is not None and read_title(out_dir) != locked_title:
            restore_title(out_dir, locked_title)
            st.record_file_hashes(state, "write", out_dir)
            st.save_state(cfg, state)
            log.warning("[%s] 본문 재작성이 확정 제목을 바꿔 원래 제목으로 되돌림", slug)

    st.mark_stage(state, "judge", "failed", f"상한 {max_rounds}회 도달 · 점수 이력 {totals}")
    st.save_state(cfg, state)
    raise StageError(
        f"judge 루프 상한({max_rounds}회) 도달 — 점수 이력 {totals}",
        slug=slug, stage="judge", detail=str(totals),
    )
