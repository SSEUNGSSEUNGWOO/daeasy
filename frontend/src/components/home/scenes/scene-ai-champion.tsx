"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "../../gsap-setup";

/**
 * 여정 4단계가 이 섹션의 주인공. 실적 수치는 비공개 지침으로 싣지 않는다 —
 * 카드는 각 단계에서 "무엇을 직접 하는가"만 말한다.
 * 헤드라인은 히어로 배지("행정안전부 AI 챔피언 인증 운영기관")와
 * 겹치지 않게 '누구'가 아니라 '어떻게'를 말한다.
 */
const JOURNEY_STEPS = [
  {
    title: "역량체계 설계",
    body: "역량진단 모델·평가 지표를 직접 개발했습니다.",
  },
  {
    title: "교육 운영",
    body: "종합과정을 공식 대행해 학습·과제를 지원합니다.",
  },
  {
    title: "인증평가",
    body: "CBT·본인확인·화상 감독으로 평가를 운영합니다.",
    highlight: true,
  },
  {
    title: "결과 관리",
    body: "채점·심사와 통계까지 운영합니다.",
  },
] as const;

export function SceneAiChampion() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 카드가 여정 순서대로 하나씩 켜진다 — stagger 를 크게 잡아 순차성이 읽히게.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".champ-head",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 78%", once: true },
          },
        );
        gsap.fromTo(
          ".champ-step",
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.16,
            ease: "power2.out",
            scrollTrigger: { trigger: ".champ-steps", start: "top 82%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    /* 히어로(밝음) 바로 다음이라 어두운 면으로 받는다. 색·글로우는 /ai-champion 히어로와 같다. */
    <section ref={scope} className="relative isolate overflow-hidden bg-ink-warm text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(37,99,235,0.26),transparent_44%)]"
      />

      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <p className="champ-head text-[13px] font-bold uppercase tracking-[0.18em] text-blue-300">
              국가 AI 인재 인증
            </p>
            <h2 className="champ-head mt-3 text-[36px] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-[48px] lg:text-[54px]">
              진단부터 인증까지,<br />전 과정을 직접 운영합니다.
            </h2>
          </div>
          <div className="champ-head">
            <p className="max-w-sm text-[15px] leading-[1.75] text-zinc-300">
              교육만 하는 곳은 많습니다. 진단 체계를 설계하고 인증까지 운영하는 곳은
              드뭅니다.
            </p>
            <Link
              href="/ai-champion"
              className="group mt-4 inline-flex items-center gap-2 text-[15px] font-bold text-white"
            >
              AI 챔피언 자세히 보기
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* 여정 카드 4장. 연결선은 lg 에서만 — 접힌 폭에서는 번호가 순서를 대신한다. */}
        <ol className="champ-steps mt-14 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {JOURNEY_STEPS.map((step, index) => {
            const highlight = "highlight" in step && step.highlight;
            return (
              <li key={step.title} className="champ-step relative">
                {/* 노드 → 다음 노드 연결선. 카드 바깥 위쪽에 그린다. */}
                {index < JOURNEY_STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -top-0 left-[calc(50%+1.75rem)] hidden h-px w-[calc(100%-3.5rem+1.5rem)] translate-y-3.5 bg-white/10 lg:block"
                  />
                )}
                <span
                  aria-hidden
                  className={`relative z-10 mx-0 grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-bold ring-1 lg:mx-auto ${
                    highlight
                      ? "bg-blue-500/20 text-blue-200 ring-blue-400/50"
                      : "bg-ink-warm text-blue-300 ring-white/20"
                  }`}
                >
                  0{index + 1}
                </span>
                <div
                  className={`mt-5 h-[calc(100%-3rem)] rounded-2xl p-6 ring-1 backdrop-blur-sm ${
                    highlight
                      ? "bg-blue-500/[0.12] ring-blue-400/40"
                      : "bg-white/[0.06] ring-white/10"
                  }`}
                >
                  <h3 className="text-[17px] font-bold leading-[1.35]">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-zinc-400">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
