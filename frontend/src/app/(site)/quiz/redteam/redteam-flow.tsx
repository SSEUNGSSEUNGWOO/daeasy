"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type { CourseLevel } from "@/lib/courses";

import { RECO_COURSES, ROUNDS, type Option } from "./content";

export type RedteamCourse = {
  slug: string;
  title: string;
  level: CourseLevel;
};

type Phase = "intro" | "play" | "result";

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "심화",
};

/** 봇 답변 타자기. key 로 재마운트되므로 상태 초기화가 필요 없고, setState 는 interval 안에서만 한다.
 *  interval 은 다 찍을 때까지만 살아 있고, 완료 통지는 별도 effect 로 — 상태 갱신 함수 안에서 부수효과를 내지 않는다 */
function BotReply({ text, onDone }: { text: string; onDone: () => void }) {
  const [len, setLen] = useState(0);
  const done = len >= text.length;
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setLen((cur) => Math.min(text.length, cur + 2)), 30);
    return () => window.clearInterval(id);
  }, [done, text]);
  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);
  return (
    <p role="status" aria-busy={!done} className="text-[15px] leading-[1.75] text-ink">
      {text.slice(0, len)}
      {!done && <span aria-hidden="true">▊</span>}
    </p>
  );
}

function Verdict({ breached }: { breached: boolean }) {
  return breached ? (
    <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
      뚫림
    </span>
  ) : (
    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
      막힘
    </span>
  );
}

export function RedteamFlow({ courses }: { courses: RedteamCourse[] }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  // 라운드별 첫 선택의 뚫림 여부 — 점수
  const [breaches, setBreaches] = useState<boolean[]>([]);

  // BotReply 의 effect 의존성 — 매 렌더 새 함수면 타자기가 렌더마다 다시 시작한다
  const onTyped = useCallback(() => setTyped(true), []);

  const round = ROUNDS[roundIdx]!;
  const option: Option | null = picked === null ? null : round.options[picked]!;
  const isLast = roundIdx === ROUNDS.length - 1;
  const score = breaches.filter(Boolean).length;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setTyped(false);
    setShowOthers(false);
    setBreaches((prev) => [...prev, round.options[i]!.breached]);
  }

  function next() {
    if (isLast) {
      setPhase("result");
      return;
    }
    setRoundIdx((r) => r + 1);
    setPicked(null);
    setTyped(false);
    setShowOthers(false);
  }

  function restart() {
    setPhase("intro");
    setRoundIdx(0);
    setPicked(null);
    setTyped(false);
    setShowOthers(false);
    setBreaches([]);
  }

  // ── 인트로 ──
  if (phase === "intro") {
    return (
      <div className="anim-page-fade-up mt-12">
        <div className="rounded-2xl bg-white p-7 ring-1 ring-zinc-200">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            게임 방법
          </p>
          <ul className="mt-4 space-y-2 text-[15px] leading-[1.75] text-zinc-700">
            <li>라운드마다 규칙이 걸린 공공 챗봇이 나옵니다. 규칙은 화면에 보입니다.</li>
            <li>던질 말 4개 중 하나를 고르면 챗봇이 답합니다 — 규칙을 지켰는지, 뚫렸는지 판정합니다.</li>
            <li>5라운드, 첫 선택만 점수에 들어갑니다. 판정 뒤에 다른 말들의 결과도 볼 수 있습니다.</li>
          </ul>
          <p className="mt-4 text-[13px] leading-[1.6] text-zinc-500">
            챗봇의 답변은 실제 사고 유형을 바탕으로 미리 써둔 대사입니다. 실제 모델을 호출하지 않습니다.
          </p>
          <button
            type="button"
            onClick={() => setPhase("play")}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-accent/90"
          >
            1라운드 시작 →
          </button>
        </div>
      </div>
    );
  }

  // ── 결과 ──
  if (phase === "result") {
    const recos = RECO_COURSES.flatMap(({ slug, reason }) => {
      const course = courses.find((c) => c.slug === slug);
      return course ? [{ course, reason }] : [];
    });
    return (
      <div className="anim-page-fade-up mt-12">
        <div className="overflow-hidden rounded-2xl bg-ink text-white">
          <div className="px-7 py-6">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-white/50">
              레드팀 결과
            </p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[44px] font-extrabold leading-none tracking-[-0.03em]">
                {score} / {ROUNDS.length}
              </span>
              <span className="text-[17px] font-semibold text-white/70">
                라운드에서 첫 시도에 뚫었습니다
              </span>
            </p>
            <p className="mt-4 text-[14px] leading-[1.7] text-white/60">
              {score >= 4
                ? "공격자의 감각이 있습니다 — 그 감각이 곧 방어 설계의 출발점입니다."
                : score >= 2
                  ? "절반쯤 보였습니다. 아래 다섯 원칙이 나머지 절반입니다."
                  : "막힌 쪽을 골랐다는 건 규칙을 믿었다는 뜻입니다. 규칙은 문장이고, 문장은 뚫립니다."}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-7 ring-1 ring-zinc-200">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            다섯 가지 원칙
          </p>
          <ol className="mt-4 space-y-4">
            {ROUNDS.map((r, i) => (
              <li key={r.id} className="flex gap-3">
                <span className="mt-0.5 shrink-0">
                  <Verdict breached={breaches[i] ?? false} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-zinc-500">{r.vuln}</p>
                  <p className="mt-1 text-[15px] leading-[1.7] text-ink">{r.lesson}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {recos.length > 0 ? (
          <div className="mt-8">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
              이 감각을 실무로 옮기는 교육
            </p>
            <ul className="mt-4 space-y-4">
              {recos.map(({ course, reason }) => (
                <li key={course.slug} className="rounded-2xl bg-white p-7 ring-1 ring-accent/30">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
                    {LEVEL_LABEL[course.level]}
                  </span>
                  <h3 className="mt-3 text-[19px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.65] text-zinc-600">{reason}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/contact?course=${encodeURIComponent(course.slug)}`}
                      className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-accent/90"
                    >
                      이 과정으로 문의하기
                    </Link>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-5 py-2.5 text-[14px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      과정 자세히 보기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-8">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-5 py-2.5 text-[14px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              전체 교육과정 보기
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={restart}
          className="mt-8 text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
        >
          다시 해보기
        </button>
      </div>
    );
  }

  // ── 라운드 ──
  return (
    <div className="anim-page-fade-up mt-12" key={round.id}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          Round {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
          뚫음 {score}
        </span>
      </div>

      {/* 챗봇 카드 — 규칙이 보여야 추리 게임이 된다 */}
      <div className="mt-4 rounded-2xl bg-white p-7 ring-1 ring-zinc-200">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-[18px]"
          >
            🤖
          </span>
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
              {round.bot.name}
            </h2>
            <p className="mt-1 text-[14px] text-zinc-600">{round.bot.purpose}</p>
          </div>
        </div>
        <p className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-[14px] leading-[1.65] text-zinc-800 ring-1 ring-zinc-200">
          <span className="font-bold text-zinc-500">규칙 </span>
          {round.bot.rule}
        </p>
        <p className="mt-4 text-[15px] leading-[1.7] text-zinc-700">{round.setup}</p>
      </div>

      {/* 선택지 */}
      <p className="mt-8 text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-400">
        어떤 말을 던져볼까요?
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {round.options.map((o, i) => {
          const isPicked = picked === i;
          return (
            <button
              key={o.text}
              type="button"
              onClick={() => pick(i)}
              disabled={picked !== null}
              aria-pressed={isPicked}
              className={`rounded-xl p-5 text-left ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isPicked
                  ? "bg-accent/5 ring-2 ring-accent"
                  : picked !== null
                    ? "bg-white ring-zinc-200 opacity-50"
                    : "bg-white ring-zinc-200 hover:ring-2 hover:ring-accent"
              }`}
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-accent">
                {o.tag}
              </span>
              <span className="mt-1.5 block text-[15px] font-semibold leading-[1.5] text-ink">
                {o.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* 답변 + 판정 */}
      {option && (
        <div className="anim-page-fade-up mt-6 rounded-2xl bg-white p-7 ring-1 ring-zinc-200">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            🤖 {round.bot.name}
          </p>
          <div className="mt-3">
            <BotReply key={`${round.id}-${picked}`} text={option.reply} onDone={onTyped} />
          </div>

          {typed && (
            <div className="anim-page-fade-up mt-6 border-t border-zinc-100 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <Verdict breached={option.breached} />
                <span className="text-[13px] font-bold text-zinc-500">{round.vuln}</span>
              </div>
              <p className="mt-3 text-[15px] leading-[1.75] text-ink">{option.why}</p>

              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers}
                className="mt-5 text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
              >
                {showOthers ? "다른 말들 접기" : "다른 말들은 어땠을까?"}
              </button>
              {showOthers && (
                <ul className="mt-3 space-y-2">
                  {round.options.map((o, i) =>
                    i === picked ? null : (
                      <li key={o.text} className="flex items-start gap-2 text-[14px] leading-[1.6]">
                        <span className="mt-0.5 shrink-0">
                          <Verdict breached={o.breached} />
                        </span>
                        <span className="text-zinc-700">
                          <span className="font-semibold text-ink">{o.text}</span>
                          <span className="text-zinc-500"> — {o.why}</span>
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-accent/90"
                >
                  {isLast ? "결과 보기 →" : "다음 라운드 →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
