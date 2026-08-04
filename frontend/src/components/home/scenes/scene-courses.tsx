"use client";

/* 추천 과정 가로 레일.
   데스크톱: 핀 + 스크롤 진행에 따라 레일이 가로로 흐름.
   완화판: 네이티브 가로 스와이프 (기본 마크업 그대로). */

import { useRef } from "react";
import Link from "next/link";

import { gsap, MM_DESKTOP, useGSAP } from "./gsap-setup";

export type CourseCard = {
  slug: string;
  track: string;
  clean: string;
  summary: string;
};

export function SceneCourses({ courses }: { courses: CourseCard[] }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MM_DESKTOP, () => {
        const viewport = scope.current?.querySelector<HTMLElement>(".courses-viewport");
        const track = scope.current?.querySelector<HTMLElement>(".courses-track");
        if (!viewport || !track) return;

        gsap.set(viewport, { overflowX: "hidden" });

        gsap.to(track, {
          x: () => -(track.scrollWidth - viewport.clientWidth),
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: () => `+=${track.scrollWidth - viewport.clientWidth}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="border-t border-zinc-100 bg-zinc-50/70">
      <div className="mx-auto flex max-w-[1280px] flex-col justify-center px-6 py-20 lg:min-h-screen lg:px-10 lg:py-24">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Programs</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              추천 교육과정.
            </h2>
            <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
              AI 리터러시부터 LLM 서비스 개발까지. 모든 과정은 사전 인터뷰 후 조직 데이터·도구에 맞춰 재설계됩니다.
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
                  <span className="self-start rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                    {c.track}
                  </span>
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
