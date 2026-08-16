"use client";

/* 파트너 마퀴 + 진입 시 로고 등장.
   실적 수치와 수상 배지는 뺐다 — 수상은 상단 띠와 푸터 배지가 맡는다. */

import { useRef } from "react";

import { gsap, MM_DESKTOP, useGSAP } from "./gsap-setup";

type Partner = { name: string; logo?: string };

const PARTNERS: Partner[] = [
  { name: "행정안전부", logo: "/partners/mois.png" },
  { name: "농촌진흥청", logo: "/partners/rda.png" },
  { name: "한국지능정보사회진흥원", logo: "/partners/nia.png" },
  { name: "한라그룹", logo: "/partners/halla.png" },
  { name: "식품의약품안전처", logo: "/partners/mfds.png" },
  { name: "국민건강보험", logo: "/partners/nhis.png" },
  { name: "관세청", logo: "/partners/customs.png" },
  { name: "서울교통공사", logo: "/partners/seoul-metro.png" },
  { name: "부산광역시", logo: "/partners/busan.png" },
  { name: "부산광역시교육청", logo: "/partners/bsedu.png" },
  { name: "한국과학창의재단", logo: "/partners/kofac.png" },
  { name: "한국데이터산업협회", logo: "/partners/kdata.png" },
  { name: "동우화인캠주식회사", logo: "/partners/dongwoo.png" },
  { name: "가평군", logo: "/partners/gapyeong.png" },
  { name: "구리시", logo: "/partners/guri.png" },
  { name: "여주시", logo: "/partners/yeoju.png" },
];

export function ScenePartners() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MM_DESKTOP, () => {
        gsap.fromTo(
          ".partners-head",
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 80%", once: true },
          },
        );
        gsap.fromTo(
          ".partners-strip",
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.9,
            delay: 0.2,
            ease: "power1.out",
            scrollTrigger: { trigger: scope.current, start: "top 80%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 pt-16 lg:px-10 lg:pt-20">
        <div className="partners-head text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Together with
          </p>
          <h2 className="mt-3 text-[24px] font-extrabold leading-[1.2] tracking-[-0.015em] text-ink sm:text-[28px]">
            공공·민간 현장에서 검증된 교육 파트너
          </h2>
        </div>
      </div>
      <div className="partners-strip mt-10 mb-16 lg:mb-20 overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="marquee-track flex w-max gap-12">
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="group relative z-0 flex h-12 w-[180px] flex-shrink-0 items-center justify-center hover:z-10"
              aria-hidden={i >= PARTNERS.length}
            >
              {p.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-10 w-auto max-w-[180px] object-contain transition-transform duration-200 ease-out group-hover:scale-150"
                />
              ) : (
                <span className="text-center text-[14.5px] font-semibold text-zinc-500 transition-transform duration-200 group-hover:scale-125">
                  {p.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
