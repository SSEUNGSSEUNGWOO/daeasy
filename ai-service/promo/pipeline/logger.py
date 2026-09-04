# -*- coding: utf-8 -*-
"""로깅 — logs/YYYYMMDD.log(UTF-8) + 콘솔. 단계·루프 횟수·점수 변화를 남긴다."""

import logging
import sys
from datetime import datetime


def setup_logger(cfg) -> logging.Logger:
    """로거 구성 — 파일(logs/YYYYMMDD.log, DEBUG)과 콘솔(INFO, utf-8 재구성)."""
    logs_dir = cfg["paths"]["logs_dir"]
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / f"{datetime.now():%Y%m%d}.log"

    log = logging.getLogger("pr_orchestrator")
    log.setLevel(logging.DEBUG)
    log.handlers.clear()

    fmt = logging.Formatter("[%(asctime)s] %(levelname)s %(message)s", "%Y-%m-%d %H:%M:%S")

    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    log.addHandler(fh)

    # 콘솔은 cp949 환경에서도 깨지지 않게 utf-8 재구성 시도
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:  # noqa: BLE001 - 재구성 불가 환경이면 그대로 둔다
        pass
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    log.addHandler(ch)

    return log
