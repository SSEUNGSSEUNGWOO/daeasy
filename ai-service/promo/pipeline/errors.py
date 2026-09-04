# -*- coding: utf-8 -*-
"""파이프라인 예외 계층.

- PipelineError      : 이 파이프라인의 모든 의도된 예외의 뿌리
- FatalClaudeError   : claude CLI 자체가 반복 실패(재시도 소진·실행 파일 부재) —
                       전체 실행을 중단한다 (exit 1, C12)
- StageError         : 건(slug) 단위 실패 — 해당 건만 중단하고 다음 건으로 넘어간다
- StalledError       : 점수 정체·회귀로 인한 중단 (StageError의 일종)
"""


class PipelineError(Exception):
    """파이프라인 공통 예외."""


class FatalClaudeError(PipelineError):
    """claude CLI 호출이 재시도를 소진하고도 실패 — 전체 실행 중단."""


class StageError(PipelineError):
    """건 단위 단계 실패. 보고서에 남기고 다음 건으로 진행한다."""

    def __init__(self, message: str, slug: str = "", stage: str = "", detail: str = ""):
        """slug·stage·detail을 보고서·로그용 맥락으로 함께 담는다."""
        super().__init__(message)
        self.slug = slug
        self.stage = stage
        self.detail = detail


class StalledError(StageError):
    """점수가 오르지 않는 정체(stall) 또는 사이클 상한 도달로 인한 회귀 중단."""
