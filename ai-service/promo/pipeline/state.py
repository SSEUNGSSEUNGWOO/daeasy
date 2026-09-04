# -*- coding: utf-8 -*-
"""단계별 진행 상태(state/<slug>.json)·인덱스(_index.json)·실행 lock.

핵심 규약
- 모든 저장은 임시 파일 + os.replace 원자 쓰기.
- reset_stage/set_cycle 은 메모리 변경만 한다 (C24). 영속화는 호출자가 save_state로.
- begin_next_cycle 은 judge·review pending 전환 + cycle 증가를 단 한 번의
  save_state로 원자 영속화한다 (C24 — 영속화가 재작성보다 먼저).
- lock 은 O_EXCL 생성(C13) + heartbeat mtime 갱신(C2) + stale 회수 시
  FileNotFoundError/PermissionError → 경쟁 패배 처리 (C20).
"""

import hashlib
import json
import os
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path

from .config import cfg_get

# 해시 대장에 올리는 파일 — judge·review·quality의 수동 편집 감지 대상 (C11)
HASH_FILES = ("post.md", "naver.md")
WRITE_FILES = ("insight.md", "photos.md", "post.md", "naver.md")

# draft 채널에서 done으로 치는 상태 (C18·C23:
#  skipped·failed·already_exists_stale 은 done이 아니다 → 재실행마다 재시도)
DRAFT_DONE = {"ok", "already_exists", "draft_ready"}


def _now() -> str:
    """현재 시각의 ISO 문자열 (초 단위) — state 기록용 공통 포맷."""
    return datetime.now().isoformat(timespec="seconds")


# ---------------------------------------------------------------- state 파일

def state_path(cfg, slug: str) -> Path:
    """해당 slug의 state 파일 경로 (state/<slug>.json)."""
    return cfg["paths"]["state_dir"] / f"{slug}.json"


def load_state(cfg, slug: str) -> dict:
    """state 파일을 읽는다. 없으면 초기 골격(dict)을 만들어 돌려준다."""
    p = state_path(cfg, slug)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {
        "slug": slug,
        "folder": "",
        "created_at": _now(),
        "updated_at": _now(),
        "cycle": 1,
        "stages": {},
        "quality": {"passed": False},
        "draft": {},
        "history": {"judge": [], "review": [], "final": []},
    }


def _atomic_write(path: Path, text: str) -> None:
    """임시 파일 + os.replace 원자 쓰기 — 크래시 시 반쪽짜리 파일을 막는다."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def save_state(cfg, state: dict) -> None:
    """state를 updated_at 갱신 후 원자적으로 저장한다."""
    state["updated_at"] = _now()
    _atomic_write(state_path(cfg, state["slug"]), json.dumps(state, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------- 해시 대장 (C11)

def file_hashes(out_dir: Path, names=HASH_FILES) -> dict:
    """names 중 존재하는 파일의 sha256 해시 맵 — 수동 편집 감지(E22)의 재료."""
    hashes = {}
    for name in names:
        f = out_dir / name
        if f.exists():
            hashes[name] = hashlib.sha256(f.read_bytes()).hexdigest()
    return hashes


def record_file_hashes(state: dict, stage: str, out_dir: Path, names=HASH_FILES) -> None:
    """해당 단계 완료 시점의 파일 해시를 state에 기록한다 (메모리만)."""
    state["stages"].setdefault(stage, {})["hashes"] = file_hashes(out_dir, names)


def files_unmodified(state: dict, stage: str, out_dir: Path) -> bool:
    """기록 해시와 현재 해시가 완전히 일치하는지 — 기록이 없으면 False."""
    recorded = state["stages"].get(stage, {}).get("hashes")
    if not recorded:
        return False
    return recorded == file_hashes(out_dir, tuple(recorded.keys()))


# ---------------------------------------------------------------- 단계 상태

def mark_stage(state: dict, stage: str, status: str, detail: str = "") -> dict:
    """단계 상태·시각·상세를 기록하고 그 엔트리를 돌려준다 (메모리만)."""
    entry = state["stages"].setdefault(stage, {})
    entry.update({"status": status, "at": _now(), "detail": detail})
    return entry


def reset_stage(state: dict, stage: str, reason: str = "") -> None:
    """메모리 변경만. 저장하지 않는다 (C24) — 영속화는 begin_next_cycle의 몫."""
    state["stages"][stage] = {
        "status": "pending",
        "reset_at": _now(),
        "reset_reason": reason,
    }


def is_stage_done(cfg, state: dict, stage: str, out_dir: Path) -> bool:
    """단계별 완료 판정 대응표 (C6·C11·C18·C23) — 이 함수가 유일한 기준."""
    st = state["stages"].get(stage, {})
    done = st.get("status") == "done"
    if stage == "intake":
        return done and (out_dir / "brief.md").exists()
    if stage == "research":
        return done and (out_dir / "research.md").exists()
    if stage == "write":
        return done and all((out_dir / f).exists() for f in WRITE_FILES)
    if stage in ("judge", "review"):
        return (
            done
            and all((out_dir / f).exists() for f in HASH_FILES)
            and files_unmodified(state, stage, out_dir)
        )
    raise ValueError(f"알 수 없는 단계: {stage}")


# ---------------------------------------------------------------- 사이클 (C17·C24)

def get_cycle(state: dict) -> int:
    """영속된 현재 사이클 번호 (기본 1) — 재개 시 복원의 기준 (C17)."""
    return int(state.get("cycle", 1))


def set_cycle(state: dict, n: int) -> None:
    """메모리 변경만 (C24). 사이클 진입 기록은 호출자가 save_state 1회로."""
    state["cycle"] = int(n)


def begin_next_cycle(cfg, state: dict, slug: str, next_cycle: int) -> None:
    """5.5 불통과 시 상태 전이의 원자적 영속화 (C24).

    judge·review pending 전환 + cycle=next_cycle 을 모두 메모리에서 바꾼 뒤
    단 한 번의 save_state로 기록한다. 이 함수가 리턴한 뒤 어디서 크래시해도
    재개 시 judge 루프부터 재가동되고 사이클 번호도 정확하다 (D15 불변식).
    """
    reset_stage(state, "judge", reason=f"5.5 불통과 → 사이클 {next_cycle} 재진입")
    reset_stage(state, "review", reason=f"5.5 불통과 → 사이클 {next_cycle} 재진입")
    set_cycle(state, next_cycle)
    save_state(cfg, state)


# ---------------------------------------------------------------- 품질 게이트 (C11)

def mark_quality_passed(state: dict, out_dir: Path) -> None:
    """품질 게이트 통과를 통과 시점 해시와 함께 기록한다 (메모리만, C11)."""
    state["quality"] = {"passed": True, "at": _now(), "hashes": file_hashes(out_dir)}


def is_quality_passed(state: dict, out_dir: Path) -> bool:
    """통과 플래그 + 통과 시점 해시 일치일 때만 True.

    수동 편집(E22)으로 해시가 어긋나면 False → 4·5·5.5를 다시 돈다.
    """
    q = state.get("quality", {})
    if not q.get("passed"):
        return False
    recorded = q.get("hashes") or {}
    return recorded == file_hashes(out_dir, tuple(recorded.keys()) or HASH_FILES)


# ---------------------------------------------------------------- 인덱스

def _index_path(cfg) -> Path:
    """접수 인덱스 파일 경로 (state/_index.json)."""
    return cfg["paths"]["state_dir"] / "_index.json"


def load_index(cfg) -> dict:
    """접수 인덱스를 읽는다. 없으면 빈 골격을 돌려준다."""
    p = _index_path(cfg)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {"updated_at": "", "slugs": {}}


def save_index(cfg, index: dict) -> None:
    """접수 인덱스를 updated_at 갱신 후 원자적으로 저장한다."""
    index["updated_at"] = _now()
    _atomic_write(_index_path(cfg), json.dumps(index, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------- 실행 lock

_lock_token: str | None = None
_hb_thread: threading.Thread | None = None
_hb_stop: threading.Event | None = None


def _lock_path(cfg) -> Path:
    """실행 lock 파일 경로 (config lock.path)."""
    return cfg["lock"]["path"]


def acquire_lock(cfg, log) -> bool:
    """O_EXCL 원자 생성으로 lock 획득 (C13).

    - stale(heartbeat 기준 stale_after_sec 초과) lock은 회수 후 재시도.
    - 회수 삭제에서 FileNotFoundError/PermissionError 가 나면 경쟁 패배로
      보고 진입을 거부한다 (C20, Windows에서 흔함).
    - 재시도 횟수는 lock.acquire_retries (C22).
    """
    global _lock_token
    lock = _lock_path(cfg)
    lock.parent.mkdir(parents=True, exist_ok=True)
    stale_after = int(cfg_get(cfg, "lock.stale_after_sec", 600))
    attempts = int(cfg_get(cfg, "lock.acquire_retries", 2)) + 1
    token = f"{os.getpid()}-{uuid.uuid4().hex}"

    for attempt in range(1, attempts + 1):
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(token)
            _lock_token = token
            log.debug("lock 획득: %s", lock)
            return True
        except FileExistsError:
            try:
                age = time.time() - lock.stat().st_mtime
            except OSError:
                # 그 사이 사라짐 — 다음 시도에서 O_EXCL 경합
                continue
            if age > stale_after:
                log.warning("stale lock 회수 시도 (%.0f초 경과 > %d초)", age, stale_after)
                try:
                    os.remove(lock)
                except (FileNotFoundError, PermissionError):
                    log.warning("stale lock 회수 경쟁 패배 — 진입 거부")
                    return False
                continue  # 회수 성공 → 재시도에서 O_EXCL 생성
            if attempt < attempts:
                time.sleep(2)
                continue
            log.warning("다른 실행이 lock 보유 중 (%.0f초 경과)", age)
            return False
    return False


def start_heartbeat(cfg, log) -> None:
    """lock 보유 중 mtime 주기 갱신 — 정상 실행이 stale 판정되지 않게 한다 (C2)."""
    global _hb_thread, _hb_stop
    if _lock_token is None:
        return
    interval = int(cfg_get(cfg, "lock.heartbeat_sec", 60))
    lock = _lock_path(cfg)
    _hb_stop = threading.Event()

    def beat(stop_event=_hb_stop):
        """중지 신호가 올 때까지 interval초마다 lock mtime을 갱신한다."""
        while not stop_event.wait(interval):
            try:
                os.utime(lock)
            except OSError as ex:
                log.warning("heartbeat 갱신 실패: %s", ex)

    _hb_thread = threading.Thread(target=beat, daemon=True, name="lock-heartbeat")
    _hb_thread.start()


def stop_heartbeat() -> None:
    """heartbeat 스레드를 중지·정리한다. 시작 전이어도 안전하게 호출 가능."""
    global _hb_thread, _hb_stop
    if _hb_stop is not None:
        _hb_stop.set()
    if _hb_thread is not None:
        _hb_thread.join(timeout=5)
    _hb_thread = None
    _hb_stop = None


def release_lock(cfg, log) -> None:
    """토큰 소유 검사 후에만 삭제 — 남의 lock을 지우지 않는다."""
    global _lock_token
    if _lock_token is None:
        return
    lock = _lock_path(cfg)
    try:
        if lock.exists() and lock.read_text(encoding="utf-8").strip() == _lock_token:
            os.remove(lock)
            log.debug("lock 해제: %s", lock)
        else:
            log.warning("lock 토큰 불일치 — 회수당한 것으로 보고 삭제하지 않음")
    except OSError as ex:
        log.warning("lock 해제 실패: %s", ex)
    _lock_token = None
