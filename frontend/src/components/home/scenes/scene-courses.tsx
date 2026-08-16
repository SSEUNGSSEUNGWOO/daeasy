"use client";

/* 추천 과정 가로 레일. 모든 화면에서 네이티브 가로 스와이프를 쓴다. */

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "./gsap-setup";

export type CourseCard = {
  slug: string;
  clean: string;
  summary: string;
  levelLabel: string;
  hours: number;
};

export function SceneCourses({ courses }: { courses: CourseCard[] }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 핀 + 가로 스크럽 레일은 걷어냈다. 모든 화면에서 네이티브 가로 스와이프를 쓰고,
      // 진입 시 카드 스태거 reveal 만 남긴다.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".courses-track > li",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.08,
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
      <div className="mx-auto flex max-w-[1280px] flex-col justify-center px-6 py-20 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">교육과정</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              공공기관 업무에 맞춘 AI·데이터 교육
            </h2>
            <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
              생성형 AI 업무 활용부터 데이터 분석과 AI 서비스 개발까지, 조직의 직무와 목표에 맞춰 설계합니다.
            </p>
          </div>
          <Link href="/courses" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
            전체 과정 보기
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="courses-viewport mt-12 -mx-6 overflow-x-auto px-6 pb-4 lg:-mx-10 lg:px-10 [scrollbar-width:thin]">
          <ul className="courses-track flex w-max snap-x snap-mandatory gap-5">
            {courses.map((c) => (
              <li key={c.slug} className="w-[300px] shrink-0 snap-start sm:w-[360px]">
                <Link
                  href={`/courses/${c.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-white p-7 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                      {c.levelLabel}
                    </span>
                    {c.hours > 0 && (
                      <span className="text-[12px] font-semibold text-zinc-400">{c.hours}시간</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-[18px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                    {c.clean}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[14px] leading-[1.65] text-zinc-600">
                    {c.summary}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold text-zinc-500 transition group-hover:text-accent">
                    자세히 보기 →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
