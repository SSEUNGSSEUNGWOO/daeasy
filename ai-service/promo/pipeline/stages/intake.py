# -*- coding: utf-8 -*-
"""1단계 접수 — prpub scan / build.

- scan --json 은 항상 전체 수행해 인덱스를 최신화한다 (--slug는 이후 처리 필터).
- intake가 이미 done인 slug은 절대 재빌드하지 않는다:
  `prpub build`는 out/<slug>/ 를 rmtree 후 재생성하기 때문 (F2).
- 검증 실패 건은 사유와 함께 인덱스·보고서에 남긴다.
"""

import json
import re

from ..config import cfg_get, out_dir_of, prpub_root
from ..errors import StageError
from ..procs import run_cmd
from .. import state as st


def compute_slug(entry: dict) -> str:
    """prpub.build.slugify 재현 — date_from + org + course."""
    data = entry.get("data", {}) or {}
    date_from = (data.get("dates", "") or "").strip()[:10]
    parts = [date_from, data.get("org", ""), data.get("course", "")]
    return "_".join(
        re.sub(r"[^\w가-힣]+", "-", p).strip("-") for p in parts if p
    )


def run_scan(cfg, log) -> list[dict]:
    """`prpub scan --json` 전체 스캔 → 접수 엔트리 목록. 실패 시 StageError."""
    cmd = ["uv", "run", "prpub", "scan", "--json"]
    timeout = int(cfg_get(cfg, "prpub.scan_timeout_sec", 120))
    res = run_cmd(cmd, cwd=prpub_root(cfg), timeout_sec=timeout, log=log)
    if res.error or res.timed_out or res.returncode != 0:
        raise StageError(
            "prpub scan 실패",
            stage="intake",
            detail=res.error or res.stderr[:300] or f"rc={res.returncode}",
        )
    try:
        entries = json.loads(res.stdout)
    except json.JSONDecodeError as ex:
        raise StageError("scan --json 파싱 실패", stage="intake", detail=str(ex)) from ex
    log.info("접수함 스캔: %d건", len(entries))
    return entries


def run_intake(cfg, entries: list[dict], slug_filter: str | None, log):
    """검증 통과 건을 빌드하고 (targets, failures)를 돌려준다.

    targets  : 이후 단계로 진행할 slug 목록 (slug_filter 적용 후)
    failures : [{"folder":…, "errors":[…]}] — 검증 실패·빌드 실패 건
    """
    from pathlib import Path

    index = st.load_index(cfg)
    targets: list[str] = []
    failures: list[dict] = []

    for entry in entries:
        folder = Path(entry.get("folder", "")).name
        ok = not entry.get("errors")
        if not ok:
            failures.append({"folder": folder, "errors": entry.get("errors", [])})
            log.warning("접수 제외: %s — %s", folder, "; ".join(entry.get("errors", [])))
            continue

        slug = compute_slug(entry)
        out_dir = out_dir_of(cfg, slug)
        state = st.load_state(cfg, slug)
        state["folder"] = folder

        if st.is_stage_done(cfg, state, "intake", out_dir):
            # F2 보호: 완료된 intake는 재빌드 금지 (rmtree 방지)
            log.info("[%s] intake 완료 — build 생략 (F2 재빌드 금지)", slug)
        else:
            build_timeout = int(cfg_get(cfg, "prpub.build_timeout_sec", 300))
            res = run_cmd(
                ["uv", "run", "prpub", "build", folder],
                cwd=prpub_root(cfg),
                timeout_sec=build_timeout,
                log=log,
            )
            if not res.ok or not (out_dir / "brief.md").exists():
                detail = res.error or res.stderr[:300] or res.stdout[:300]
                failures.append({"folder": folder, "errors": [f"build 실패: {detail}"]})
                log.error("[%s] build 실패: %s", slug, detail)
                index["slugs"][slug] = {
                    "folder": folder, "ok": False, "errors": [f"build 실패: {detail}"],
                }
                continue
            st.mark_stage(state, "intake", "done", f"build 완료: {folder}")
            log.info("[%s] intake done (build)", slug)

        st.save_state(cfg, state)
        index["slugs"][slug] = {
            "folder": folder,
            "ok": True,
            "errors": [],
            "warnings": entry.get("warnings", []),
        }

        if slug_filter and slug != slug_filter:
            log.info("[%s] --slug 필터로 이번 실행에서 제외", slug)
            continue
        targets.append(slug)

    st.save_index(cfg, index)
    return targets, failures
