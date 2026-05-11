"use client";

import { useEffect, useRef, useState } from "react";

type Common = {
  className?: string;
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
};

function useInView(threshold: number, rootMargin: string) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}

export function Reveal({
  className = "",
  children,
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
}: Common) {
  const { ref, visible } = useInView(threshold, rootMargin);
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function RevealList({
  className = "",
  children,
  threshold = 0.1,
  rootMargin = "0px 0px -10% 0px",
}: Common) {
  const { ref, visible } = useInView(threshold, rootMargin);
  return (
    <ul
      ref={ref as React.RefObject<HTMLUListElement>}
      className={`reveal-stagger ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </ul>
  );
}
