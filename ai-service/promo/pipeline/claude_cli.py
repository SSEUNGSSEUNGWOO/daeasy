# -*- coding: utf-8 -*-
"""claude CLI 호출 래퍼.

- 프롬프트는 항상 stdin으로 전달한다 (C1: Windows argv 32K 제한).
- 역할별 allowedTools/disallowedTools 는 config.yaml에서 온다.
  · researcher의 WebFetch는 `WebFetch(domain:<허용 도메인>)` 형태로 인코딩해
    허용 도메인 밖 접근을 CLI 수준에서 막는다 (C4).
  · judge/reviewer는 allowedTools를 비우는 대신 생략하고 disallowedTools로
    Read·Grep·Glob까지 봉쇄한다 (C9·C14) — 본문은 프롬프트로 주입한다.
- 타임아웃·재시도(claude.retries, 기본 3회)·형식 재요청(claude.reformat_retries)
  을 두고, 재시도 소진 시 FatalClaudeError로 전체 중단한다 (C12).
"""

import json
import re
import time

from .config import cfg_get, prpub_root
from .errors import FatalClaudeError, StageError
from .procs import run_cmd


def build_claude_args(cfg, role: str) -> list[str]:
    """역할별 claude -p 명령 인자 조립 — 모델·공통 인자·allowed/disallowedTools.

    web_domains는 WebFetch(domain:…) 형태로 allowedTools에 인코딩한다 (C4).
    """
    args = [
        cfg_get(cfg, "claude.cmd", "claude"),
        "-p",
        "--output-format", "text",
    ]
    model = cfg_get(cfg, "claude.model", "")
    if model:
        args += ["--model", model]
    args += list(cfg_get(cfg, "claude.extra_args", []) or [])

    role_cfg = cfg_get(cfg, f"claude.roles.{role}", {}) or {}
    allowed = list(role_cfg.get("allowed_tools", []) or [])
    allowed += [f"WebFetch(domain:{d})" for d in role_cfg.get("web_domains", []) or []]
    disallowed = list(role_cfg.get("disallowed_tools", []) or [])
    if allowed:
        args += ["--allowedTools", ",".join(allowed)]
    if disallowed:
        args += ["--disallowedTools", ",".join(disallowed)]
    return args


def call_claude(cfg, role: str, prompt: str, log, slug: str = "") -> str:
    """claude -p 1회 호출(재시도 포함). 실패가 재시도를 소진하면 FatalClaudeError."""
    args = build_claude_args(cfg, role)
    timeout = int(cfg_get(cfg, "claude.timeout_sec", 900))
    retries = int(cfg_get(cfg, "claude.retries", 3))
    wait = int(cfg_get(cfg, "claude.retry_wait_sec", 10))
    cwd = prpub_root(cfg)  # out/·scripts/ 상대 경로가 통하도록 pr-publish에서 실행

    last = ""
    for attempt in range(1, retries + 1):
        log.info("[%s] claude 호출 (%s, 시도 %d/%d)", slug or "-", role, attempt, retries)
        res = run_cmd(args, cwd=cwd, timeout_sec=timeout, log=log, stdin_text=prompt)
        if res.error:
            raise FatalClaudeError(f"claude 실행 불가: {res.error}")
        if res.ok and res.stdout.strip():
            return res.stdout.strip()
        last = (
            f"rc={res.returncode} timed_out={res.timed_out} "
            f"stderr={res.stderr.strip()[:300]}"
        )
        log.warning("[%s] claude 호출 실패 (%s): %s", slug or "-", role, last)
        if attempt < retries:
            time.sleep(wait)
    raise FatalClaudeError(f"claude 호출이 {retries}회 모두 실패: {last}")


def extract_json(text: str) -> dict | None:
    """응답 텍스트에서 JSON 오브젝트를 추출한다. 코드블록 우선, 없으면 최외곽 중괄호."""
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    candidates = []
    if m:
        candidates.append(m.group(1))
    start, end = text.find("{"), text.rfind("}")
    if 0 <= start < end:
        candidates.append(text[start : end + 1])
    for cand in candidates:
        try:
            obj = json.loads(cand)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            continue
    return None


def call_claude_json(cfg, role: str, prompt: str, log, slug: str = "", schema_hint: str = "") -> dict:
    """JSON 응답 강제. 파싱 실패 시 형식 재요청(reformat_retries회) 후 StageError."""
    text = call_claude(cfg, role, prompt, log, slug=slug)
    obj = extract_json(text)
    if obj is not None:
        return obj

    reformats = int(cfg_get(cfg, "claude.reformat_retries", 1))
    for _ in range(reformats):
        log.warning("[%s] JSON 파싱 실패 — 형식 재요청", slug or "-")
        fix_prompt = (
            "아래 응답에서 요구된 스키마의 JSON 오브젝트만 추출해, 다른 텍스트 없이 "
            "JSON만 출력하라. 스키마 설명:\n"
            f"{schema_hint}\n\n--- 응답 원문 ---\n{text[:20000]}"
        )
        text = call_claude(cfg, role, fix_prompt, log, slug=slug)
        obj = extract_json(text)
        if obj is not None:
            return obj
    raise StageError("claude 응답 JSON 파싱 실패 (형식 재요청 포함)", slug=slug, detail=text[:500])
