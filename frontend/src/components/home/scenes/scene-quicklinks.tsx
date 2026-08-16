"use client";

/* 히어로 다음의 진입 링크.
   인사이트·문의는 아래 SceneInsights / SceneCta 가 이미 맡고 있어 여기서 뺐다.
   남긴 둘은 히어로 직후의 질문 — "믿을 만한가"(후기), "나한테 맞나"(퀴즈) — 에 대응한다. */

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { gsap, useGSAP } from "./gsap-setup";

const PHOTO_CARDS = [
  { href: "/cases", img: "/hero/cases.jpg", label: "교육 후기" },
  { href: "/quiz", img: "/hero/quiz.jpg", label: "내게 맞는 교육 찾기" },
];

export function SceneQuicklinks() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".quicklink-card",
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 82%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
          {PHOTO_CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="quicklink-card group relative block aspect-[3/2] overflow-hidden rounded-2xl ds-card-soft transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* 바로 위 히어로가 흑백 영상이라 기본은 흑백으로 톤을 잇고,
                  hover 에서만 컬러를 돌려준다. */}
              <Image
                src={c.img}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover grayscale transition duration-500 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              <div className="relative flex h-full w-full flex-col justify-end p-7">
                <span className="inline-flex items-center gap-2 text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-white">
                  {c.label}
                  <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
