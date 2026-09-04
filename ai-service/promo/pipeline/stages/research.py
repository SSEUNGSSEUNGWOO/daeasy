# -*- coding: utf-8 -*-
"""2단계 정보수집 — claude -p 리서처 역할.

- brief.md를 읽고 그 교육을 다룬 기사·기관 보도자료를 찾아 research.md 작성.
- 네이버 계열 크롤링 절대 금지 — 검색은 scripts/search_kr.py, 열람은 허용 도메인
  WebFetch만 (allowedTools로 CLI 수준 강제, C4).
- 자료가 없으면 없는 대로 기록하고 진행한다. 지어내지 않는다.
"""

from ..claude_cli import call_claude
from ..config import cfg_get
from ..errors import StageError
from ..prompts import load_prompt, read_out_file, render
from .. import state as st


def run_research(cfg, slug: str, out_dir, state: dict, log) -> None:
    """2단계 정보수집 — 리서처 호출로 research.md를 만든다.

    done이면 스킵. brief.md 부재·산출 파일 미생성이면 StageError.
    """
    if st.is_stage_done(cfg, state, "research", out_dir):
        log.info("[%s] research 완료 — 스킵", slug)
        return

    brief = read_out_file(out_dir, "brief.md")
    if not brief:
        raise StageError("brief.md 없음 — intake부터 다시", slug=slug, stage="research")

    domains = cfg_get(cfg, "claude.roles.researcher.web_domains", []) or []
    prompt = render(
        load_prompt(cfg, "researcher"),
        slug=slug,
        out_dir=str(out_dir),
        brief=brief,
        allowed_domains=", ".join(domains) if domains else "(허용 도메인 없음 — WebFetch 사용 불가)",
    )
    call_claude(cfg, "researcher", prompt, log, slug=slug)

    if not (out_dir / "research.md").exists():
        raise StageError(
            "research.md가 생성되지 않음", slug=slug, stage="research",
            detail="리서처 호출은 끝났으나 산출 파일이 없다",
        )
    st.mark_stage(state, "research", "done")
    st.save_state(cfg, state)
    log.info("[%s] research done", slug)
