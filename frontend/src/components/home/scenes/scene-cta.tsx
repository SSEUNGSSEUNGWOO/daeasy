"use client";

/* 최종 CTA — 잉크 카드가 차오르며 문구가 스태거로 등장. */

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "./gsap-setup";

export function SceneCta() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 카드 스케일 스크럽은 걷어냈다. 진입 시 1회 페이드업만 둔다.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".cta-card",
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 80%", once: true },
          },
        );
        gsap.fromTo(
          ".cta-content > *",
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.09,
            delay: 0.1,
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
    <section ref={scope} className="bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="cta-card rounded-3xl bg-ink-warm p-10 text-white sm:p-16 lg:p-20">
          <div className="grid grid-cols-12 gap-x-8 gap-y-8">
            <div className="cta-content col-span-12 lg:col-span-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
                Get in touch
              </p>
              <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[52px]">
                우리 조직에 맞는 교육 과정,<br />일주일 안에 제안해 드립니다.
              </h2>
              <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-zinc-300">
                무료 상담을 통해 조직의 업무와 데이터 환경을 확인하고, 현장에서 바로 활용할 수 있는 교육 과정을 제안해 드립니다.
              </p>
            </div>
            <div className="col-span-12 flex flex-col gap-3 self-end sm:flex-row lg:col-span-4 lg:flex-col">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90"
              >
                교육 문의하기
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 bg-transparent px-7 py-4 text-[15px] font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
              >
                커리큘럼 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
