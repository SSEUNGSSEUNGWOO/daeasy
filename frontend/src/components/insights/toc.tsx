"use client";

import { useEffect, useState } from "react";

import { LikeButton } from "./like-button";

export type TocItem = {
  id: string;
  text: string;
  level: number;
  index?: number;
};

export function TableOfContents({
  items,
  likeSlug,
}: {
  items: TocItem[];
  likeSlug?: string;
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
            if (item.id === "top") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              document
                .getElementById(item.id)
                ?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className={`block border-l-2 py-0.5 leading-snug transition-colors ${
            item.level === 3 ? "pl-6 text-[12px]" : "pl-3 text-[13px]"
          } ${
            active === item.id
              ? "border-[#0F0F0F] font-semibold text-[#0F0F0F]"
              : "border-transparent text-zinc-500 hover:text-[#0F0F0F]"
          }`}
        >
          {item.level === 3 && item.index !== undefined
            ? `${item.index}. ${item.text}`
            : item.text}
        </a>
      ))}
      {likeSlug && (
        <div className="flex justify-center pt-6">
          <LikeButton slug={likeSlug} />
        </div>
      )}
    </div>
  );
}
