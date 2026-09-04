# -*- coding: utf-8 -*-
"""서브프로세스 실행 헬퍼.

- run_cmd는 예외를 던지지 않고 CmdResult로 흡수한다 (crash 방지).
- 프롬프트 등 큰 입력은 stdin_text로 전달한다 (C1: Windows argv 32,767자 제한 회피).
- 타임아웃 시 Windows에서는 taskkill /T 로 자식 트리까지 정리한다
  (claude → node, prpub naver → chrome 등 손자 프로세스가 남는 것을 막는다).
"""

import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class CmdResult:
    """서브프로세스 실행 결과 — 성공/실패·타임아웃·실행 불가 사유를 한 값에 담는다."""

    cmd: list[str]
    returncode: int | None
    stdout: str
    stderr: str
    timed_out: bool = False
    error: str = ""  # FileNotFoundError 등 실행 자체가 안 된 사유
    extra: dict = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        """정상 종료 여부 — rc=0이면서 타임아웃·실행 오류가 없을 때만 True."""
        return self.returncode == 0 and not self.timed_out and not self.error


def _child_env() -> dict:
    """자식 프로세스용 환경변수 — 파이프 출력을 utf-8로 강제한다."""
    env = dict(os.environ)
    # 파이썬 자식(prpub·score.py)의 파이프 출력이 cp949로 깨지지 않게 한다
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    return env


def run_cmd(
    cmd: list[str],
    cwd: Path,
    timeout_sec: int,
    log,
    stdin_text: str | None = None,
) -> CmdResult:
    """명령을 실행하고 결과를 CmdResult로 흡수한다 (예외를 던지지 않는다).

    stdin_text가 있으면 utf-8로 파이프 전달(C1), 타임아웃 시 프로세스 트리를
    정리한 뒤 남은 출력까지 회수한다.
    """
    log.debug("실행: %s (cwd=%s, timeout=%ss)", " ".join(cmd[:6]) + (" …" if len(cmd) > 6 else ""), cwd, timeout_sec)
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            stdin=subprocess.PIPE if stdin_text is not None else subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=_child_env(),
        )
    except FileNotFoundError as ex:
        return CmdResult(cmd, None, "", "", error=f"실행 파일 없음: {ex}")
    except OSError as ex:
        return CmdResult(cmd, None, "", "", error=f"실행 실패: {ex}")

    try:
        out_b, err_b = proc.communicate(
            input=stdin_text.encode("utf-8") if stdin_text is not None else None,
            timeout=timeout_sec,
        )
        timed_out = False
    except subprocess.TimeoutExpired:
        timed_out = True
        _kill_tree(proc)
        try:
            out_b, err_b = proc.communicate(timeout=15)
        except Exception:  # noqa: BLE001
            out_b, err_b = b"", b""

    stdout = (out_b or b"").decode("utf-8", errors="replace")
    stderr = (err_b or b"").decode("utf-8", errors="replace")
    return CmdResult(cmd, proc.returncode, stdout, stderr, timed_out=timed_out)


def _kill_tree(proc: subprocess.Popen) -> None:
    """프로세스 강제 종료 — Windows에서는 taskkill /T로 자식 트리까지 정리."""
    if sys.platform == "win32":
        subprocess.run(
            ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
            capture_output=True,
            check=False,
        )
    else:
        proc.kill()
