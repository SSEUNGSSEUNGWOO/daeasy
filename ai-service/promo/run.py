# -*- coding: utf-8 -*-
"""홍보발행 오케스트레이터 파이프라인 — 진입점.

접수(prpub scan/build) → 정보수집 → 글 작성 → LLM-as-judge 정량평가 →
형식 검토 → (5.5 최종 재판정) → 발행(사이트 공개 또는 draft, 네이버 무발행) → 실행 보고서.

실행 (ai-service/ 에서): uv run python promo/run.py [--config <path>] [--slug <slug>] [--reset <slug>] [--yes]
"""
import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from pipeline.config import load_config, out_dir_of, validate_environment
from pipeline.errors import FatalClaudeError, PipelineError, StageError, StalledError
from pipeline.logger import setup_logger
from pipeline.report import write_report
from pipeline import state as st
from pipeline.stages import draft as draft_stage
from pipeline.stages import intake as intake_stage
from pipeline.stages import research as research_stage
from pipeline.stages import review as review_stage
from pipeline.stages import write as write_stage
from pipeline.stages.judge import run_judge_loop, run_judge_once, verdict_to_targets
from pipeline.config import cfg_get


def parse_args() -> argparse.Namespace:
    """CLI 인자 파싱 — --slug와 --reset의 동시 지정은 여기서 거부한다."""
    ap = argparse.ArgumentParser(
        prog="promo/run.py",
        description="홍보발행 오케스트레이터 파이프라인 (접수 → … → 발행 준비까지)",
    )
    ap.add_argument("--config", default=None, help="config.yaml 경로 (기본: 프로젝트 루트)")
    ap.add_argument("--slug", default=None, help="이 slug 건만 처리한다 (scan·인덱스 최신화는 전체 수행)")
    ap.add_argument("--reset", default=None, metavar="SLUG",
                    help="해당 slug의 state·인덱스 항목을 삭제한다 (파이프라인 미실행)")
    ap.add_argument("--yes", action="store_true",
                    help="--reset의 확인 프롬프트를 생략한다 (비-tty에서 --reset을 쓰려면 필수)")
    args = ap.parse_args()
    if args.slug and args.reset:
        ap.error("--slug 와 --reset 은 동시에 지정할 수 없습니다")
    return args


def run_reset(cfg, slug: str, args: argparse.Namespace, log) -> int:
    """--reset의 유일한 구현 — 확인이 먼저, lock은 삭제 직전에만 (C21·C26·C27).

    순서: ① 경고 출력 → ② input() 확인(부작용 없음 — lock 획득 전이라 프롬프트를
    아무리 오래 방치해도 다른 실행을 막지 않는다, E35) → ③ acquire_lock →
    ④ state·인덱스 삭제 → ⑤ finally: release_lock. lock 보유 구간은 삭제 수 초뿐이라
    heartbeat 없이도 stale(600초)에 닿지 않는다.
    """
    state_file = st.state_path(cfg, slug)
    index = st.load_index(cfg)
    in_index = slug in index.get("slugs", {})

    # ① 경고
    print("[reset] 삭제 대상:")
    print(f"  - state 파일: {state_file} ({'있음' if state_file.exists() else '없음'})")
    print(f"  - _index.json 항목: {slug} ({'있음' if in_index else '없음'})")
    print("  ⚠️ 다음 실행 시 이 건은 build부터 재시작되며, "
          f"pr-publish의 out/{slug}/ 가 통째로 삭제·재생성됩니다 (F2).")

    # ② 확인 — lock 획득 전, 부작용 없음 (C27)
    if args.yes:
        print("[reset] --yes 지정 — 확인 생략")
    else:
        if not sys.stdin.isatty():
            print("[reset] 비대화형 환경에서는 --yes 없이 진행할 수 없습니다.", file=sys.stderr)
            return 1
        try:
            answer = input("계속하려면 y 를 입력하세요: ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            # isatty=True여도 입력이 닫힌 환경(리다이렉트 등)이 있다 — 거부로 처리
            print("\n[reset] 입력이 없어 취소했습니다. 비대화형에서는 --yes 를 쓰세요.", file=sys.stderr)
            return 1
        if answer != "y":
            print("[reset] 취소했습니다.")
            return 1

    # ③ lock — 파이프라인과 동일 규약(stale 회수·O_EXCL·재시도) 재사용 (C26)
    if not st.acquire_lock(cfg, log):
        print("[reset] 다른 실행이 진행 중입니다. 끝난 뒤 다시 시도하세요.", file=sys.stderr)
        return 1
    try:
        # ④ 삭제
        if state_file.exists():
            state_file.unlink()
            log.info("[reset] state 삭제: %s", state_file)
        if in_index:
            del index["slugs"][slug]
            st.save_index(cfg, index)  # 원자 쓰기
            log.info("[reset] 인덱스 항목 삭제: %s", slug)
        print(f"[reset] 완료 — {slug}")
        return 0
    finally:
        # ⑤ 해제
        st.release_lock(cfg, log)


def process_slug(cfg, slug: str, log) -> None:
    """건 하나를 2단계부터 발행 준비까지 진행한다."""
    out_dir = out_dir_of(cfg, slug)
    state = st.load_state(cfg, slug)

    # 2·3단계 — done이면 스킵
    research_stage.run_research(cfg, slug, out_dir, state, log)
    write_stage.run_write(cfg, slug, out_dir, state, log)

    # ★ 품질 게이트 (C11): 통과 + 해시 일치면 4·5·5.5 전체 스킵
    if st.is_quality_passed(state, out_dir):
        log.info("[%s] 품질 게이트 통과 상태 — 4·5·5.5 스킵", slug)
    else:
        max_cycles = int(cfg_get(cfg, "pipeline.max_cycles", 2))
        c = st.get_cycle(state)  # C17: 영속 사이클 복원
        while True:
            st.set_cycle(state, c)
            st.save_state(cfg, state)  # 사이클 진입 기록 1회
            log.info("[%s] 사이클 %d/%d 진입", slug, c, max_cycles)

            # 4단계 judge 루프 / 5단계 review 루프
            run_judge_loop(cfg, slug, out_dir, state, log)
            review_stage.run_review_loop(cfg, slug, out_dir, state, log)

            # 5.5단계 — judge 최종 재판정 (review rewrite의 점수 회귀 감지, C10)
            verdict = run_judge_once(cfg, slug, out_dir, log)
            state["history"]["final"].append({"cycle": c, "round": 0, **verdict})
            st.save_state(cfg, state)
            log.info("[%s] 5.5 최종 재판정: 총점 %d/14 · %s",
                     slug, verdict["total"], "통과" if verdict["passed"] else "불통과")

            if verdict["passed"]:
                st.mark_quality_passed(state, out_dir)
                st.save_state(cfg, state)
                break

            # 불통과 — ① 타깃 변환(메모리) ② 상한 판정 먼저(회귀 시 rewrite 낭비 금지)
            targets = verdict_to_targets(verdict, "final_judge")
            if c + 1 > max_cycles:
                finals = [h["total"] for h in state["history"]["final"]]
                raise StalledError(
                    f"stalled_regression — 사이클 상한({max_cycles}) 도달, "
                    f"5.5 점수 이력 {finals}. draft 차단",
                    slug=slug, stage="quality", detail=str(finals),
                )
            # ③ 상태 전이 원자 영속화 (C24) → ④ 재작성 → ⑤ 사이클 재진입
            st.begin_next_cycle(cfg, state, slug, c + 1)
            write_stage.run_rewrite(cfg, slug, out_dir, targets, log, state=state)
            c += 1

    # 6단계 — 발행 (config publish.* 에 따라 공개 또는 draft)
    draft_stage.run_draft(cfg, slug, out_dir, state, log)


def run_pipeline(cfg, args: argparse.Namespace, log) -> int:
    """전체 실행 — 접수 후 건별 처리(건 단위 오류는 흡수), 마지막에 보고서 작성.

    FatalClaudeError만 위로 올려 전체를 중단하고(C12), 그 외 건별 예외는
    run_errors에 모아 보고서에 남긴다. --slug 미매칭이면 exit 1.
    """
    entries = intake_stage.run_scan(cfg, log)
    targets, failures = intake_stage.run_intake(cfg, entries, args.slug, log)

    if args.slug and not targets:
        log.error("--slug %s 에 매칭되는 접수 건이 없습니다.", args.slug)
        return 1

    run_errors: dict[str, str] = {}
    for slug in targets:
        try:
            process_slug(cfg, slug, log)
        except StalledError as ex:
            run_errors[slug] = f"정체/회귀 중단: {ex}"
            log.error("[%s] %s", slug, run_errors[slug])
        except StageError as ex:
            run_errors[slug] = f"{ex.stage or '단계'} 실패: {ex}"
            log.error("[%s] %s", slug, run_errors[slug])
        except PipelineError as ex:
            if isinstance(ex, FatalClaudeError):
                raise  # 전체 중단 (C12)
            run_errors[slug] = str(ex)
            log.error("[%s] %s", slug, run_errors[slug])

    write_report(cfg, targets, failures, run_errors, log)
    return 0


def main() -> int:
    """진입점 — 설정·로거 초기화 후 --reset 분기 또는 lock 획득·파이프라인 실행.

    lock·heartbeat는 finally에서 반드시 해제한다. Ctrl+C는 130으로 종료.
    """
    load_dotenv(Path(__file__).parent.parent / ".env")
    os.environ.pop("ANTHROPIC_API_KEY", None)  # Claude CLI는 구독 사용, API 크레딧 금지

    args = parse_args()
    if args.yes and not args.reset:
        print("[경고] --yes 는 --reset 과 함께일 때만 의미가 있습니다 — 무시합니다.", file=sys.stderr)

    # 공통 초기화 — --reset 분기도 여기를 거친다 (C29)
    cfg = load_config(args.config)
    log = setup_logger(cfg)

    if args.reset:
        return run_reset(cfg, args.reset, args, log)

    validate_environment(cfg, log)

    if not st.acquire_lock(cfg, log):
        log.error("다른 실행이 진행 중입니다 (lock). 끝난 뒤 다시 시도하세요.")
        return 1
    st.start_heartbeat(cfg, log)
    try:
        return run_pipeline(cfg, args, log)
    except KeyboardInterrupt:
        log.warning("사용자 중단 (Ctrl+C) — lock을 해제하고 종료합니다. 재실행 시 이어서 진행됩니다.")
        return 130
    except FatalClaudeError as ex:
        log.error("치명 오류로 전체 중단: %s", ex)
        return 1
    finally:
        st.stop_heartbeat()
        st.release_lock(cfg, log)


if __name__ == "__main__":
    raise SystemExit(main())
