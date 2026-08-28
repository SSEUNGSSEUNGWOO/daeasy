"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "../gsap-setup";

const STEPS = [
  ["선수과목", "AI·데이터 기초역량을 갖춥니다."],
  ["이러닝", "등급별 지정 과목을 학습합니다."],
  ["집중수업", "3일 동안 과제 중심으로 실습합니다."],
  ["셀프스터디", "개인별 문제 해결 과제를 수행합니다."],
  ["수행평가", "실제 업무형 과제로 역량을 검증합니다."],
  ["인증", "기준 충족 시 등급별 인증서를 발급합니다."],
] as const;

export function JourneySection() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 진행선: 스크롤 위치에 비례해 위에서 아래로 채운다 (scrub).
        gsap.fromTo(
          ".journey-fill",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".journey-list",
              start: "top 72%",
              end: "bottom 62%",
              scrub: true,
            },
          },
        );

        gsap.utils.toArray<HTMLElement>(".journey-step").forEach((step) => {
          gsap.fromTo(
            step,
            { autoAlpha: 0, x: 18 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.55,
              ease: "power2.out",
              scrollTrigger: { trigger: step, start: "top 82%", once: true },
            },
          );
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    /* 위(등급)·아래(평가)가 모두 흰 면이라 종이색(paper)으로 끊는다.
       왼쪽 sticky 칼럼은 나중에 현장 사진이 들어갈 자리 — 지금은 카피만 둔다. */
    <section ref={scope} className="border-y border-zinc-200/70 bg-paper">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div className="reveal lg:sticky lg:top-28 lg:self-start">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">학습 여정</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
              시험 한 번이 아니라<br />41시간의 여정입니다.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.8] text-zinc-600">
              이러닝으로 기초를 다지고, 3일 집중수업과 셀프스터디를 거쳐 실제 업무형 과제로
              평가받는 종합과정입니다.
            </p>
            <p className="mt-8 border-l-2 border-accent pl-4 text-[13px] leading-[1.7] text-zinc-500">
              과정 안내·집중수업·셀프스터디·수행평가를 포함해 총 41시간으로 구성됩니다.
              이러닝 학습 시간은 별도입니다.
            </p>
          </div>
          <ol className="journey-list relative">
            <span aria-hidden className="absolute bottom-4 left-3.5 top-1 w-px bg-zinc-300" />
            <span aria-hidden className="journey-fill absolute bottom-4 left-3.5 top-1 w-px origin-top bg-accent" />
            {STEPS.map(([title, body], index) => (
              <li key={title} className="journey-step relative pl-14 pb-11 last:pb-0">
                <span
                  aria-hidden
                  className="absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full bg-white font-mono text-[11px] font-bold text-zinc-500 ring-1 ring-zinc-300"
                >
                  0{index + 1}
                </span>
                <h3 className="text-[19px] font-bold text-ink">{title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-[1.7] text-zinc-600">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
