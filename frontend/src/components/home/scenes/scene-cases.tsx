"use client";

/* 최신 교육후기 3건 — 교육과정·결과물 뒤에 붙는 사회적 증거.
   연출: 진입 시 헤더 → 카드 순서로 1회 페이드업 (인사이트 섹션과 동일). */

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "../../gsap-setup";

export type CaseCard = {
  slug: string;
  title: string;
  client_name: string | null;
  thumbnail_url: string | null;
  dateLabel: string; // 서버에서 포맷해 내려준다
};

export function SceneCases({ cases }: { cases: CaseCard[] }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".cases-head",
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
          ".case-card",
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

  if (cases.length === 0) return null;

  return (
    <section ref={scope} className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="cases-head flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">교육후기</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              현장이 남긴 이야기
            </h2>
            <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
              공공기관·기업·교육기관에서 진행한 교육의 실제 후기입니다.
            </p>
          </div>
          <Link href="/cases" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
            후기 전체 보기
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <div key={c.slug} className="case-card">
              <Link
                href={`/cases/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-zinc-50/70 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[12.5px] font-semibold tracking-[0.04em] text-zinc-500">
                    {c.dateLabel}
                    {c.client_name ? (
                      <>
                        <span aria-hidden className="mx-2 text-zinc-300">·</span>
                        <span className="text-zinc-700">{c.client_name}</span>
                      </>
                    ) : null}
                  </p>
                  <h3 className="mt-3 line-clamp-2 text-[17px] font-bold leading-[1.4] tracking-[-0.01em] text-ink">
                    {c.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
