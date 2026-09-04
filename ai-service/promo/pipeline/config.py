# -*- coding: utf-8 -*-
"""config.yaml 로드·검증.

- 모든 경로·기준점수·루프 상한·claude CLI 옵션은 config.yaml에서 온다 (하드코딩 금지).
- 상대 경로는 이 프로젝트 루트 기준으로 해석한다.
- cfg_get(cfg, "a.b.c", default) 점표기 접근 헬퍼를 제공한다.
"""

import shutil
import sys
from pathlib import Path

import yaml

# 이 파일 기준 프로젝트 루트 (…/ai-service/promo)
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def cfg_get(cfg: dict, dotted: str, default=None):
    """점 표기("lock.stale_after_sec")로 설정값을 꺼낸다."""
    node = cfg
    for key in dotted.split("."):
        if not isinstance(node, dict) or key not in node:
            return default
        node = node[key]
    return node


def _resolve(base: Path, value: str) -> Path:
    """상대 경로를 base 기준 절대 경로로 만든다. 절대 경로는 그대로 둔다."""
    p = Path(value)
    return p if p.is_absolute() else (base / p).resolve()


def load_config(path: str | None = None) -> dict:
    """config.yaml을 읽고 경로를 절대경로로 정규화한다. 문제가 있으면 즉시 종료."""
    cfg_path = _resolve(PROJECT_ROOT, path) if path else PROJECT_ROOT / "config.yaml"
    if not cfg_path.exists():
        print(f"[설정 오류] config 파일이 없습니다: {cfg_path}", file=sys.stderr)
        raise SystemExit(1)
    try:
        cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as ex:
        print(f"[설정 오류] config 파싱 실패: {ex}", file=sys.stderr)
        raise SystemExit(1)

    cfg["_project_root"] = PROJECT_ROOT
    cfg["_config_path"] = cfg_path

    # 프로젝트 내부 경로
    for key, default in (
        ("state_dir", "state"),
        ("logs_dir", "logs"),
        ("output_dir", "output"),
        ("prompts_dir", "prompts"),
    ):
        cfg.setdefault("paths", {})
        cfg["paths"][key] = _resolve(PROJECT_ROOT, cfg.get("paths", {}).get(key, default))

    # pr-publish 경로
    prpub_root = cfg_get(cfg, "prpub.root")
    if not prpub_root:
        print("[설정 오류] prpub.root 가 비어 있습니다.", file=sys.stderr)
        raise SystemExit(1)
    cfg["prpub"]["root"] = Path(prpub_root)
    if not cfg["prpub"]["root"].is_dir() or not (cfg["prpub"]["root"] / "config.toml").exists():
        print(f"[설정 오류] prpub.root 가 pr-publish 프로젝트가 아닙니다: {prpub_root}", file=sys.stderr)
        raise SystemExit(1)

    # lock 경로
    lock_path = cfg_get(cfg, "lock.path", "state/pipeline.lock")
    cfg.setdefault("lock", {})
    cfg["lock"]["path"] = _resolve(PROJECT_ROOT, lock_path)

    return cfg


def validate_environment(cfg: dict, log) -> None:
    """실행 파일 사전 검사 (C8: Popen에서 FileNotFoundError로 터지기 전에 조기 실패)."""
    missing = []
    for exe in (cfg_get(cfg, "claude.cmd", "claude"), "uv"):
        if shutil.which(exe) is None:
            missing.append(exe)
    if missing:
        log.error("실행 파일을 PATH에서 찾을 수 없습니다: %s", ", ".join(missing))
        raise SystemExit(1)


def prpub_root(cfg: dict) -> Path:
    """pr-publish 프로젝트 루트 경로."""
    return cfg["prpub"]["root"]


def out_dir_of(cfg: dict, slug: str) -> Path:
    """해당 slug의 산출 폴더(pr-publish의 out/<slug>/) 경로."""
    return prpub_root(cfg) / "out" / slug
