"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "../gsap-setup";

/* SSR 마크업에는 최종 수치를 그대로 둔다 (검색엔진·reduced-motion 대응).
   모션 허용 환경에서만 0 으로 내렸다가 뷰포트 진입 시 카운트업. */
export function StatNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      el.textContent = "0";
      const counter = { v: 0 };
      gsap.to(counter, {
        v: value,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(counter.v).toLocaleString("ko-KR");
        },
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    });

    return () => mm.revert();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("ko-KR")}
    </span>
  );
}
