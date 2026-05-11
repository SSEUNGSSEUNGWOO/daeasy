"use client";

import Link from "next/link";
import { useState } from "react";

import { RevealList } from "@/components/reveal";
import type { CourseSummary } from "@/lib/courses";

const TABS: { key: "beginner" | "intermediate" | "advanced"; label: string }[] = [
  { key: "beginner", label: "초급" },
  { key: "intermediate", label: "중급" },
  { key: "advanced", label: "고급" },
];

const TRACK_PATTERN = /^\[([^\]]+)\]\s*/;

function splitTrack(title: string): { track: string; clean: string } {
  const m = title.match(TRACK_PATTERN);
  if (!m) return { track: "공개 과정", clean: title };
  return { track: m[1], clean: title.slice(m[0].length) };
}

export function CoursesTabs({ courses }: { courses: CourseSummary[] }) {
  const [active, setActive] = useState<typeof TABS[number]["key"]>("beginner");
  const filtered = courses.filter((c) => c.level === active);
  const counts = {
    beginner: courses.filter((c) => c.level === "beginner").length,
    intermediate: courses.filter((c) => c.level === "intermediate").length,
    advanced: courses.filter((c) => c.level === "advanced").length,
  };

  return (
    <>
      <div role="tablist" className="mt-12 flex flex-wrap gap-2 border-b border-zinc-200">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
              className={`relative px-5 py-3 text-[15px] font-bold transition ${
                isActive
                  ? "text-[#0F0F0F]"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[12px] font-medium text-zinc-400">
                {counts[t.key]}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-px h-[2px] bg-[#0F0F0F]"
                />
              )}
            </button>
          );
        })}
      </div>

      <RevealList key={active} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const { track, clean } = splitTrack(c.title);
          return (
            <li key={c.slug}>
              <Link
                href={`/courses/${c.slug}`}
                className="group flex h-full flex-col rounded-2xl bg-white p-7 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
              >
                <span className="self-start rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                  {track}
                </span>
                <h3 className="mt-4 text-[18px] font-bold leading-[1.35] tracking-[-0.01em] text-[#0F0F0F]">
                  {clean}
                </h3>
                <p className="mt-3 line-clamp-4 text-[14px] leading-[1.65] text-zinc-600">
                  {c.summary}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold text-zinc-500 transition group-hover:text-accent">
                  자세히 보기 →
                </span>
              </Link>
            </li>
          );
        })}
      </RevealList>
    </>
  );
}
