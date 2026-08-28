"use client";

/* 대관 배너 — 콘텐츠 유지, 가벼운 reveal 만. */

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { gsap, MM_DESKTOP, useGSAP } from "../../gsap-setup";

export function SceneRentals() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MM_DESKTOP, () => {
        gsap.fromTo(
          ".rentals-card",
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
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
        <div className="rentals-card grid grid-cols-1 overflow-hidden rounded-3xl ring-1 ring-zinc-100 lg:grid-cols-2">
          <div className="relative aspect-[4/3] lg:aspect-auto">
            <Image
              src="/rentals/space-1.jpg"
              alt="DMC타워 교육장 내부"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-zinc-50/70 p-10 sm:p-14">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
              강의실 대관
            </p>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[36px]">
              교육에 필요한 공간도<br />준비되어 있습니다.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-zinc-700">
              DMC역과 지하 통로로 연결된 단독 교육장입니다. 최대 48명이 이용할 수 있으며 빔프로젝터와 기가 인터넷을 갖추고 있습니다.
            </p>
            <Link
              href="/rentals"
              className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
            >
              강의실 자세히 보기
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
