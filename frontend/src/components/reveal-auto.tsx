"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * 페이지 내 .reveal / .reveal-stagger 요소를 IntersectionObserver 로 자동 처리.
 * (site)/layout.tsx 에 한 번만 mount, pathname 변경 시 새 페이지의 요소 다시 등록.
 */
export function RevealAuto() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document
        .querySelectorAll(".reveal, .reveal-stagger")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const targets = document.querySelectorAll(
      ".reveal:not(.is-visible), .reveal-stagger:not(.is-visible)",
    );
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
