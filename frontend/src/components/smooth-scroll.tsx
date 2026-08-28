"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * 전역 스무스 스크롤. (site) 레이아웃에서만 감싼다 — 어드민 제외.
 *
 * - prefers-reduced-motion 이면 Lenis 를 만들지 않는다 (네이티브 스크롤 유지)
 * - ScrollTrigger 와 동기화: lenis 스크롤 → ScrollTrigger.update,
 *   구동은 gsap.ticker 하나로 통일 (rAF 이중 구동 방지)
 * - Lenis 가 네이티브 smooth 스크롤(scrollIntoView 등)을 가로채므로,
 *   프로그래매틱 스크롤이 필요한 곳(목차 등)을 위해 인스턴스를 window 에 노출한다
 */
declare global {
  interface Window {
    __lenis?: Lenis;
  }
}
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
}
