"use client";

import { useEffect, useState } from "react";

import { LikeButton, type LikeResource } from "./like-button";

export type TocItem = {
  id: string;
  text: string;
  level: number;
  index?: number;
};

export function TableOfContents({
  items,
  likeSlug,
  likeResource,
}: {
  items: TocItem[];
  likeSlug?: string;
  likeResource?: LikeResource;
}) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0% -70% 0%" },
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="sticky top-24 space-y-1">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        목차
      </p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => {
            e.preventDefault();
            // Lenis 가 활성일 땐 네이티브 smooth 스크롤이 무시되므로 lenis.scrollTo 를 쓴다
            const lenis = window.__lenis;
            const el = document.getElementById(item.id);
            if (!el) return;
            if (lenis) {
              lenis.scrollTo(el, { offset: -96 }); // scroll-mt-24 와 동일한 여백
            } else {
              // window.scrollTo(smooth) 는 환경에 따라 무시되는 경우가 있어
              // top 포함 모든 이동을 scrollIntoView 로 통일한다
              el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className={`block border-l-2 py-0.5 leading-snug transition-colors ${
            item.level === 3 ? "pl-6 text-[12px]" : "pl-3 text-[13px]"
          } ${
            active === item.id
              ? "border-ink font-semibold text-ink"
              : "border-transparent text-zinc-500 hover:text-ink"
          }`}
        >
          {item.level === 3 && item.index !== undefined
            ? `${item.index}. ${item.text}`
            : item.text}
        </a>
      ))}
      {likeSlug && (
        <div className="flex justify-center pt-6">
          <LikeButton slug={likeSlug} resource={likeResource} />
        </div>
      )}
    </div>
  );
}
