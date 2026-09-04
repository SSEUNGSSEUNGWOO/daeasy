# -*- coding: utf-8 -*-
"""6단계 발행 — 기본은 draft 까지. 사이트는 config `publish.site: true` 일 때만 곧장 공개한다.

- `uv run prpub naver <slug>` (--publish 없이), `uv run prpub site <slug>` (publish.site 면 --live).
- 실행 직전 ensure_no_publish_flags 로 발행 플래그를 명시적으로 검사한다 — config 가 허용한
  플래그만 통과 (C15: assert 금지 — python -O에서도 살아 있어야 하는 안전핀).
- 채널별 독립 판정·기록 (C18): skipped(세션 부재)·failed·already_exists_stale은
  done이 아니라서 재실행마다 재시도한다.
- site slug 중복(F8) 시 기록된 content_hash와 현재 post.md 해시를 대조해
  already_exists(같음=done) / already_exists_stale(다름=수동 확인 대기)로 가른다 (C19·C23).
"""

import hashlib
from datetime import datetime

from ..config import cfg_get, prpub_root
from ..errors import PipelineError
from ..procs import run_cmd
from .. import state as st

STALE_NOTICE_TMPL = (
    "사이트의 기존 draft는 이전 본문입니다 — 관리자 화면({admin_url})에서 "
    "기존 draft를 삭제한 뒤 재실행하면 자동으로 최신본 draft가 재시도됩니다."
)


def _stale_notice(cfg) -> str:
    """stale 안내 문구 — 어드민 URL은 config의 prpub.admin_url에서 치환한다."""
    return STALE_NOTICE_TMPL.format(admin_url=cfg_get(cfg, "prpub.admin_url", ""))


def has_naver_session(cfg) -> bool:
    """네이버 세션 = .naver-profile/ 폴더 (F7)."""
    return (prpub_root(cfg) / cfg_get(cfg, "prpub.naver_profile_dir", ".naver-profile")).exists()


def has_site_session(cfg) -> bool:
    """사이트 세션 = .daeasy-session.json 파일 (F7)."""
    return (prpub_root(cfg) / cfg_get(cfg, "prpub.site_session_file", ".daeasy-session.json")).exists()


def ensure_no_publish_flags(args: list[str], allowed: frozenset[str] = frozenset()) -> None:
    """실행 인자에 config 가 허용하지 않은 발행 플래그가 섞이면 즉시 중단한다 (assert 금지 — C15)."""
    forbidden = {"--publish", "--live"} - allowed
    hit = forbidden.intersection(args)
    if hit:
        raise PipelineError(f"발행 플래그 금지: {sorted(hit)} — config publish.* 로 허용한 채널만 발행한다")


def _post_hash(out_dir) -> str:
    """post.md의 sha256 해시. 파일이 없으면 빈 문자열 (site 중복 판정용, C19)."""
    f = out_dir / "post.md"
    return hashlib.sha256(f.read_bytes()).hexdigest() if f.exists() else ""


def _record(state: dict, channel: str, status: str, detail: str = "", **extra) -> None:
    """채널별 draft 결과를 state에 기록한다 (메모리만 — 저장은 호출자가)."""
    entry = {"status": status, "at": datetime.now().isoformat(timespec="seconds"), "detail": detail}
    entry.update(extra)
    state["draft"][channel] = entry


def classify_site_result(state: dict, out_dir, cmd_result) -> str:
    """SystemExit('같은 slug…') 감지 시 해시 대조 (C19+C23)."""
    recorded = state["draft"].get("site", {}).get("content_hash", "")
    current = _post_hash(out_dir)
    if recorded and recorded == current:
        return "already_exists"
    return "already_exists_stale"


def _run_site(cfg, slug: str, out_dir, state: dict, log) -> None:
    """`prpub site <slug>` 실행 후 결과를 ok/already_exists(_stale)/skipped/failed로 분류해
    기록한다. config `publish.site` 가 참이면 `--live` 로 곧장 공개한다."""
    live = bool(cfg_get(cfg, "publish.site", False))
    args = ["uv", "run", "prpub", "site", slug] + (["--live"] if live else [])
    ensure_no_publish_flags(args, allowed=frozenset({"--live"}) if live else frozenset())
    timeout = int(cfg_get(cfg, "prpub.site_timeout_sec", 600))
    res = run_cmd(args, cwd=prpub_root(cfg), timeout_sec=timeout, log=log)
    combined = res.stdout + "\n" + res.stderr

    if res.ok:
        what = "공개 발행 완료" if live else "draft 업로드 완료 — 어드민에서 확인"
        _record(state, "site", "ok", what, content_hash=_post_hash(out_dir), live=live)
        log.info("[%s] site %s ok", slug, "publish(live)" if live else "draft")
    elif "같은 slug" in combined and "이미 있습니다" in combined:
        status = classify_site_result(state, out_dir, res)
        if status == "already_exists":
            # 기록 해시 유지 — 같은 본문이 이미 draft로 올라가 있다
            prev_hash = state["draft"].get("site", {}).get("content_hash", "")
            _record(state, "site", "already_exists", "같은 본문의 draft가 이미 있음",
                    content_hash=prev_hash)
            log.info("[%s] site draft already_exists (해시 일치)", slug)
        else:
            prev_hash = state["draft"].get("site", {}).get("content_hash", "")
            notice = _stale_notice(cfg)
            _record(state, "site", "already_exists_stale", notice,
                    content_hash=prev_hash)
            log.warning("[%s] site draft stale — %s", slug, notice)
    elif "로그인" in combined and ("만료" in combined or "세션이 없습니다" in combined
                                  or "로그인이 필요합니다" in combined):
        # 마지막 조건: 이미지 업로드 API 가 401 을 돌려준 경우 (`이미지 업로드 실패 (401): 로그인이 필요합니다`)
        _record(state, "site", "skipped",
                "로그인 세션 없음/만료 — `uv run prpub site-login` 후 재실행하면 재시도됩니다")
        log.warning("[%s] site draft skipped: 세션 없음/만료", slug)
    else:
        detail = (res.error or res.stderr[-300:] or res.stdout[-300:] or "원인 미상").strip()
        _record(state, "site", "failed", detail)
        log.error("[%s] site draft 실패: %s", slug, detail)


def _run_naver(cfg, slug: str, out_dir, state: dict, log) -> None:
    """`prpub naver <slug>` (--publish 없이) 실행 — 타임아웃이어도 미리보기 PNG가
    있으면 draft_ready로 기록한다 (F6)."""
    args = ["uv", "run", "prpub", "naver", slug]
    ensure_no_publish_flags(args)
    # F6: 무발행 모드는 본문 입력 후 10분 대기하고 스스로 종료한다 — 그보다 길게 잡는다
    timeout = int(cfg_get(cfg, "prpub.naver_timeout_sec", 1500))
    res = run_cmd(args, cwd=prpub_root(cfg), timeout_sec=timeout, log=log)

    preview = (out_dir / "naver_미리보기1.png").exists()
    if res.ok:
        _record(state, "naver", "ok", "발행 직전 정지 완료 — 미리보기 PNG 확인")
        log.info("[%s] naver draft ok", slug)
    elif res.timed_out and preview:
        _record(state, "naver", "draft_ready",
                "타임아웃으로 종료했으나 본문 입력·미리보기 저장까지 완료됨 (F6)")
        log.info("[%s] naver draft_ready (timeout, 미리보기 존재)", slug)
    else:
        detail = (res.error or res.stderr[-300:] or res.stdout[-300:] or "원인 미상").strip()
        _record(state, "naver", "failed", detail)
        log.error("[%s] naver draft 실패: %s", slug, detail)


def run_draft(cfg, slug: str, out_dir, state: dict, log) -> None:
    """채널별 독립 실행. done 채널만 스킵 (C18·C23)."""
    channels = (
        ("site", has_site_session, _run_site, "uv run prpub site-login"),
        ("naver", has_naver_session, _run_naver, "uv run prpub naver-login"),
    )
    for name, has_session, runner, login_cmd in channels:
        status = state["draft"].get(name, {}).get("status", "")
        if status in st.DRAFT_DONE:
            log.info("[%s] draft %s 완료(%s) — 스킵", slug, name, status)
            continue
        if not has_session(cfg):
            _record(state, name, "skipped",
                    f"로그인 세션 없음 — pr-publish에서 `{login_cmd}` 실행 후 재실행하면 재시도됩니다")
            st.save_state(cfg, state)
            log.warning("[%s] draft %s skipped: 세션 없음", slug, name)
            continue
        runner(cfg, slug, out_dir, state, log)
        st.save_state(cfg, state)
