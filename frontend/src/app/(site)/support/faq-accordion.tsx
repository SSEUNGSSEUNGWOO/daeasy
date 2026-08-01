"use client";

import { ReactNode, useState } from "react";

type Item = { category: string; q: string; a: ReactNode };

export function FaqAccordion({ items }: { items: Item[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <ul className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
      {items.map((f, i) => {
        const open = openIdx === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-start justify-between gap-6 py-5 text-left"
            >
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11.5px] font-semibold tracking-[0.04em] text-zinc-700">
                  {f.category}
                </span>
                <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
                  {f.q}
                </span>
              </div>
              <svg
                className={`mt-1 h-5 w-5 flex-shrink-0 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5.5 7.5l4.5 4.5 4.5-4.5" />
              </svg>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="max-w-3xl pb-5 text-[15px] leading-[1.8] text-zinc-700">
                  {f.a}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
