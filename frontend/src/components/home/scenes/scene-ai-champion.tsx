"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "../../gsap-setup";

/**
 * 여정 4단계가 이 섹션의 주인공. 실적 수치는 비공개 지침으로 싣지 않는다 —
 * 카드는 각 단계에서 "무엇을 직접 하는가"만 말하고, 빈자리는 아이콘과
 * 단계 번호가 채운다. 헤드라인은 히어로 배지("행정안전부 AI 챔피언 인증
 * 운영기관")와 겹치지 않게 '누구'가 아니라 '어떻게'를 말한다.
 */
const JOURNEY_STEPS = [
  {
    title: "역량체계 설계",
    body: "역량진단 모델과 평가 지표를 직접 개발했습니다.",
    // layers — 체계를 쌓는 단계
    icon: (
      <>
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="M2 12l10 5 10-5" />
        <path d="M2 17l10 5 10-5" />
      </>
    ),
  },
  {
    title: "교육 운영",
    body: "종합과정을 공식 대행해 학습과 과제를 지원합니다.",
    // book-open — 학습 단계
    icon: (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    ),
  },
  {
    title: "인증평가",
    body: "CBT·본인확인·실시간 화상 감독으로 공정하게 평가합니다.",
    // shield-check — 인증 단계, 여정의 정점이라 하이라이트
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    highlight: true,
  },
  {
    title: "결과 관리",
    body: "채점·심사부터 통계까지 인증 운영을 마무리합니다.",
    // bar-chart — 결과 단계
    icon: (
      <>
        <line x1="6" y1="20" x2="6" y2="16" />
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
      </>
    ),
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
          <Link
            href="/ai-champion"
            className="champ-head group inline-flex items-center gap-2 text-[15px] font-bold text-white"
          >
            AI 챔피언 자세히 보기
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* 여정 카드 4장. 카드 사이 화살표는 lg 에서만 — 접힌 폭에서는
            카드 안 번호가 순서를 대신한다. */}
        <ol className="champ-steps mt-14 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {JOURNEY_STEPS.map((step, index) => {
            const highlight = "highlight" in step && step.highlight;
            return (
              <li key={step.title} className="champ-step relative">
                {/* 카드 → 다음 카드 화살표. 아이콘 행 높이에 맞춰 띄운다. */}
                {index < JOURNEY_STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-[1.15rem] top-[38px] hidden text-zinc-600 lg:block"
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current stroke-[2]">
                      <path d="m6 3.5 5 4.5-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <div
                  className={`flex h-full flex-col rounded-2xl p-6 ring-1 backdrop-blur-sm transition-colors duration-300 motion-reduce:transition-none ${
                    highlight
                      ? "bg-blue-500/[0.12] ring-blue-400/40 hover:ring-blue-400/70"
                      : "bg-white/[0.06] ring-white/10 hover:bg-white/[0.09] hover:ring-white/25"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      aria-hidden
                      className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${
                        highlight
                          ? "bg-blue-500/25 text-blue-200 ring-blue-400/40"
                          : "bg-blue-400/10 text-blue-300 ring-white/10"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {step.icon}
                      </svg>
                    </span>
                    <span
                      aria-hidden
                      className={`font-mono text-[13px] font-bold ${
                        highlight ? "text-blue-300/70" : "text-white/25"
                      }`}
                    >
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[18px] font-bold leading-[1.35]">{step.title}</h3>
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
