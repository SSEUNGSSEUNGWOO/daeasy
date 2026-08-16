"use client";

/* 교육 진행 4단계. 모든 화면에서 그리드로 보여주고 진입 시 스태거 reveal 만 준다. */

import { useRef } from "react";

import { gsap, useGSAP } from "./gsap-setup";

const MOMENTS = [
  { tag: "01", title: "사전 인터뷰", body: "현재 업무와 사용하는 데이터·도구를 먼저 파악합니다." },
  { tag: "02", title: "맞춤 커리큘럼 설계", body: "산업과 직무, 업무 환경에 맞춰 커리큘럼을 설계합니다." },
  { tag: "03", title: "현장 강의", body: "현장 경험이 풍부한 강사가 실제 사례를 중심으로 교육합니다." },
  { tag: "04", title: "사후 코칭·모니터링", body: "교육 후 8주 동안 현업 적용을 돕고 활용 현황을 점검합니다." },
];

export function SceneProcess() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 핀 + 단계 순차 전환은 걷어냈다. 모든 화면에서 4단계 그리드를 그대로 쓰고,
      // 진입 시 스태거 reveal 만 남긴다.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".process-grid > li",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 75%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="border-t border-zinc-100 bg-zinc-50/70">
      <div className="mx-auto flex min-h-0 max-w-[1280px] flex-col justify-center px-6 py-20 lg:min-h-screen lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">How we work</p>
          <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
            교육 전 인터뷰부터<br />교육 후 코칭까지 함께합니다.
          </h2>
        </div>

        {/* 4단계 그리드 (핀 전환 스테이지를 걷어내고 이것만 남겼다) */}
        <ul className="process-grid mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOMENTS.map((m) => (
            <li key={m.tag} className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
              <p className="font-mono text-[11.5px] font-bold tracking-[0.18em] text-accent">
                Step {m.tag}
              </p>
              <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-ink">{m.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{m.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
