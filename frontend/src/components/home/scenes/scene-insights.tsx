"use client";

/* 최신 인사이트 — 스태거 reveal (가벼운 장면). */

import { useRef } from "react";
import Link from "next/link";

import { gsap, MM_DESKTOP, useGSAP } from "./gsap-setup";

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
      mm.add(MM_DESKTOP, () => {
        gsap.fromTo(
          ".insight-card",
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 72%", once: true },
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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Insights</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              최신 인사이트.
            </h2>
            <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
              AI · 데이터 동향을 일터 언어로 매일 정리해 보내드립니다.
            </p>
          </div>
          <Link href="/insights" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
            인사이트 전체 보기
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {insights.length === 0 ? (
          <p className="mt-12 rounded-2xl bg-white p-10 text-center text-[14px] text-zinc-500 ring-1 ring-zinc-100">
            곧 첫 인사이트가 발행됩니다.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 가장 최근 1건 — 크게 */}
            <div className="insight-card">
              <Link
                href={`/insights/${insights[0]!.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-zinc-50/70 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                  {insights[0]!.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={insights[0]!.image_url}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-7 sm:p-8">
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
                  <h3 className="mt-4 line-clamp-3 text-[22px] font-extrabold leading-[1.3] tracking-[-0.015em] text-ink sm:text-[26px]">
                    {insights[0]!.title}
                  </h3>
                  <p className="mt-auto pt-4 text-[13px] font-semibold text-zinc-500">
                    {insights[0]!.dateLabel}
                  </p>
                </div>
              </Link>
            </div>

            {/* 그 다음 2건 — 옆에 작게 */}
            <div className="flex flex-col gap-6">
              {insights.slice(1).map((insight) => (
                <div key={insight.slug} className="insight-card flex-1">
                  <Link
                    href={`/insights/${insight.slug}`}
                    className="group flex h-full overflow-hidden rounded-2xl bg-zinc-50/70 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                  >
                    <div className="w-36 shrink-0 overflow-hidden bg-zinc-100 sm:w-52">
                      {insight.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={insight.image_url}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
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
                      <h3 className="mt-2.5 line-clamp-2 text-[16.5px] font-bold leading-[1.4] tracking-[-0.01em] text-ink">
                        {insight.title}
                      </h3>
                      <p className="mt-2.5 text-[12.5px] font-semibold text-zinc-500">
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
