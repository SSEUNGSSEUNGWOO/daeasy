"use client";

/* 최신 인사이트 — 최신 1건을 크게(2/3 폭), 이전 2건을 옆에 컴팩트로.
   연출: 진입 시 헤더 → 카드 순서로 1회 페이드업. */

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "./gsap-setup";

export type InsightCard = {
  slug: string;
  title: string;
  image_url: string | null;
  tags: string[];
  dateLabel: string; // 서버에서 포맷해 내려준다
};

export function SceneInsights({ insights }: { insights: InsightCard[] }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 핀·스크럽은 걷어냈다. 히어로가 이미 영상이라 스크롤까지 붙잡으면 과하다.
      // 화면 크기 구분 없이 진입 시 1회 페이드업만 둔다.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".insights-head",
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 82%", once: true },
          },
        );
        gsap.fromTo(
          ".insight-featured, .insight-side",
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.12,
            delay: 0.12,
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
    <section ref={scope} className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="insights-head flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Insights</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              AI·데이터 인사이트
            </h2>
            <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
              빠르게 변하는 AI·데이터 소식을 실무자의 눈높이로 정리합니다.
            </p>
          </div>
          <Link href="/insights" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
            인사이트 전체 보기
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {insights.length === 0 ? (
          <p className="mt-12 rounded-2xl bg-zinc-50/70 p-10 text-center text-[14px] text-zinc-500 ring-1 ring-zinc-100">
            곧 첫 인사이트가 발행됩니다.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 가장 최근 1건 — 2/3 폭으로 크게 */}
            <div className="insight-featured lg:col-span-2">
              <Link
                href={`/insights/${insights[0]!.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-zinc-50/70 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100 lg:aspect-[16/8]">
                  {insights[0]!.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={insights[0]!.image_url}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-7 sm:p-9">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-accent">
                      Latest
                    </span>
                    {insights[0]!.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 line-clamp-3 text-[24px] font-extrabold leading-[1.28] tracking-[-0.015em] text-ink sm:text-[30px] lg:text-[32px]">
                    {insights[0]!.title}
                  </h3>
                  <p className="mt-auto pt-5 text-[13px] font-semibold text-zinc-500">
                    {insights[0]!.dateLabel}
                  </p>
                </div>
              </Link>
            </div>

            {/* 그 다음 2건 — 옆에 컴팩트로 */}
            <div className="flex flex-col gap-6">
              {insights.slice(1).map((insight) => (
                <div key={insight.slug} className="insight-side flex-1">
                  <Link
                    href={`/insights/${insight.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-zinc-50/70 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                  >
                    <div className="aspect-[16/7] w-full overflow-hidden bg-zinc-100">
                      {insight.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={insight.image_url}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {insight.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-2.5 line-clamp-2 text-[15.5px] font-bold leading-[1.4] tracking-[-0.01em] text-ink">
                        {insight.title}
                      </h3>
                      <p className="mt-auto pt-3 text-[12px] font-semibold text-zinc-500">
                        {insight.dateLabel}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
