"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "./gsap-setup";

export function SceneAiChampion() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".ai-champion-content > *",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 78%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="border-t border-zinc-100 bg-zinc-50/70">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="ai-champion-content max-w-4xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Proven Expertise
          </p>
          <h2 className="mt-3 text-[36px] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink sm:text-[48px] lg:text-[56px]">
            행정안전부 AI 챔피언<br />역량진단부터 인증까지 운영했습니다.
          </h2>
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-zinc-700 sm:text-[17px]">
            2025년 역량진단 모델과 평가 지표를 직접 개발하고 종합과정과 인증 평가를 공식 대행했습니다.
            교육 수료 1,372명, 표준 콘텐츠 12종, AI 챔피언 인증 541명의 경험으로 공공 현장의 AI 활용을 지원합니다.
          </p>
          <Link
            href="/ai-champion"
            className="group mt-8 inline-flex items-center gap-2 text-[15px] font-bold text-zinc-900"
          >
            AI 챔피언 자세히 보기
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
