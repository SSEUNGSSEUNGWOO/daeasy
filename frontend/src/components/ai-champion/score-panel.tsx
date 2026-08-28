"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "../gsap-setup";

/* 인증 기준(수행평가 90 + 이러닝 10, 합격선 75)을 비율 바로 보여준다.
   바 자체는 장식이라 aria-hidden — 수치는 위 텍스트와 범례가 전달한다. */
export function ScorePanel() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".score-seg",
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.15,
            scrollTrigger: { trigger: scope.current, start: "top 82%", once: true },
          },
        );
        gsap.fromTo(
          ".score-cut",
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.45,
            delay: 0.8,
            scrollTrigger: { trigger: scope.current, start: "top 82%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="mt-8 rounded-2xl bg-ink-warm p-6 text-white sm:p-7">
      <p className="text-[13px] font-bold text-blue-300">인증 기준</p>
      <p className="mt-2 text-[20px] font-extrabold">총점 75점 이상 · 절대평가</p>
      <div aria-hidden className="relative mt-7">
        <div className="flex h-2.5 gap-px overflow-hidden rounded-full">
          <span className="score-seg w-[90%] origin-left bg-accent" />
          <span className="score-seg w-[10%] origin-left bg-white/30" />
        </div>
        <span className="score-cut absolute -top-[5px] left-3/4 h-5 w-0.5 -translate-x-1/2 rounded-full bg-white" />
        <span className="score-cut absolute left-3/4 top-6 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-zinc-300">
          합격선 75점
        </span>
      </div>
      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-zinc-300">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
          수행평가 90점
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-full bg-white/30" />
          이러닝 10점
        </span>
      </div>
    </div>
  );
}
