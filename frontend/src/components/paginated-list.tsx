"use client";

import { Children, useRef, useState } from "react";

import { RevealList } from "./reveal";

type Props = {
  pageSize: number;
  className?: string;
  children: React.ReactNode;
};

/* 서버에서 렌더된 카드(li)들을 받아 클라이언트에서 페이지 단위로 잘라 보여준다.
   ponytail: 전체 목록을 한 번에 내려받는 구조 — 목록이 수백 건 규모가 되면
   서버 range() 페이지네이션으로 전환 */
export function PaginatedList({ pageSize, className = "", children }: Props) {
  const items = Children.toArray(children);
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages);
  const visible = items.slice((current - 1) * pageSize, current * pageSize);

  const go = (p: number) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* key 로 리마운트해 페이지 전환 시 reveal 애니메이션 재생 */}
      <RevealList key={current} className={className}>
        {visible}
      </RevealList>

      {totalPages > 1 && (
        <nav aria-label="페이지" className="mt-12 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => go(current - 1)}
            disabled={current === 1}
            aria-label="이전 페이지"
            className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[15px] font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === current ? "page" : undefined}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[13px] font-semibold transition ${
                p === current
                  ? "bg-ink text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => go(current + 1)}
            disabled={current === totalPages}
            aria-label="다음 페이지"
            className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[15px] font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  );
}
