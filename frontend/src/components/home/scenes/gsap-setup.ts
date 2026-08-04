"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// 플러그인 등록은 여기 한 곳에서만. 각 장면은 이 모듈에서 gsap/useGSAP 를 가져온다.
gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * 장면 공통 분기 조건.
 * - desktop: 전체 연출 (핀 + 스크럽)
 * - soft:    핀 없는 완화판 (모바일 · 태블릿)
 * - reduced: 연출 전부 없음 — matchMedia 컨텍스트가 아예 실행되지 않아 정적 레이아웃
 */
export const MM_DESKTOP =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
export const MM_SOFT =
  "(max-width: 1023px) and (prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
