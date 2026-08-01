"use client";

import { useMemo, useState } from "react";

import { sanitizeHtml } from "@/lib/sanitize";

type Module = { label: string; title: string; html: string };

const MODULE_HEADING_RE = /<h4[^>]*data-module="\d+"[^>]*>([^<]+)<\/h4>/g;
const SUBTITLE_SPLIT = /^모듈\s*\d+\s*:\s*(.+)$/;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function splitModules(html: string): { intro: string; modules: Module[] } {
  const matches = Array.from(html.matchAll(MODULE_HEADING_RE));
  if (matches.length === 0) return { intro: html, modules: [] };

  const intro = html.slice(0, matches[0].index!);
  const modules: Module[] = matches.map((m, i) => {
    const next = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    const full = decodeEntities(m[1].trim());
    const sub = SUBTITLE_SPLIT.exec(full);
    return {
      label: `모듈 ${i + 1}`,
      title: sub ? sub[1].trim() : full,
      html: html.slice(m.index! + m[0].length, next).trim(),
    };
  });
  return { intro, modules };
}

const PROSE = "prose prose-zinc max-w-none text-[16px] leading-[1.85] " +
  "prose-h4:mt-8 prose-h4:mb-4 prose-h4:text-[18px] prose-h4:font-bold prose-h4:text-ink " +
  "prose-h5:mt-5 prose-h5:mb-2 prose-h5:text-[15px] prose-h5:font-bold prose-h5:text-ink " +
  "prose-ul:my-3 prose-li:my-1 prose-p:my-3 prose-strong:text-ink";

export function CourseDescription({ html }: { html: string }) {
  const safe = useMemo(() => sanitizeHtml(html), [html]);
  const { intro, modules } = useMemo(() => splitModules(safe), [safe]);
  const [active, setActive] = useState(0);

  if (modules.length === 0) {
    return <div className={PROSE} dangerouslySetInnerHTML={{ __html: safe }} />;
  }

  const cur = modules[active];

  return (
    <div>
      <div className={PROSE} dangerouslySetInnerHTML={{ __html: intro }} />

      <div className="mt-10">
        <div role="tablist" className="flex flex-wrap gap-1 border-b border-zinc-200">
          {modules.map((m, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className={`relative px-4 py-3 text-[14px] font-bold transition ${
                  isActive ? "text-ink" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {m.label}
                {isActive && (
                  <span aria-hidden className="absolute inset-x-3 -bottom-px h-[2px] bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-7 ring-1 ring-zinc-100 sm:p-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
            {cur.label}
          </p>
          <h4 className="mt-2 text-[22px] font-extrabold leading-[1.25] tracking-[-0.01em] text-ink">
            {cur.title}
          </h4>
          <div
            className={`mt-5 ${PROSE}`}
            dangerouslySetInnerHTML={{ __html: cur.html }}
          />
        </div>
      </div>
    </div>
  );
}
