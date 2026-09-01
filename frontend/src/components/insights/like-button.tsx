"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FloatingHeart = {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
};

// 인사이트·교육후기가 같은 버튼을 공유한다 — API 경로와 저장 키만 리소스별로 다르다
const RESOURCES = {
  insights: { api: "insights", storagePrefix: "liked_insight_" },
  cases: { api: "cases", storagePrefix: "liked_case_" },
} as const;

/** 한 사람이 한 글에 누를 수 있는 상한. 없으면 한 명이 지표를 통째로 왜곡한다 */
const MAX_PER_VISITOR = 10;
/** 연타를 모아 한 번에 보내는 간격 */
const FLUSH_MS = 600;

export type LikeResource = keyof typeof RESOURCES;

export function LikeButton({
  slug,
  resource = "insights",
}: {
  slug: string;
  resource?: LikeResource;
}) {
  const [count, setCount] = useState(0);
  const [mine, setMine] = useState(0);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const counter = useRef(0);
  const pending = useRef(0);
  const timer = useRef<number | null>(null);
  const { api, storagePrefix } = RESOURCES[resource];
  const storeKey = `${storagePrefix}${slug}`;
  const liked = mine > 0;
  const maxed = mine >= MAX_PER_VISITOR;

  useEffect(() => {
    fetch(`/api/${api}/${encodeURIComponent(slug)}/likes`)
      .then((r) => r.json())
      // 응답이 늦게 와도 이미 누른 낙관적 카운트를 깎지 않는다 (좋아요는 줄지 않는다)
      .then((d) => setCount((c) => Math.max(c, d.count ?? 0)))
      .catch(() => {});
    if (typeof window !== "undefined") {
      // localStorage 는 client-only — hydrate 시점에 동기화. cascading render 1회뿐이라 안전.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMine(Number(localStorage.getItem(storeKey)) || 0);
    }
  }, [slug, api, storeKey]);

  /** 모아둔 연타를 한 요청으로 보낸다 */
  const flush = useCallback(async () => {
    const presses = pending.current;
    if (presses <= 0) return;
    pending.current = 0;
    try {
      const res = await fetch(`/api/${api}/${encodeURIComponent(slug)}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presses }),
      });
      const data = await res.json();
      // 서버 값이 낙관적 값보다 작으면 무시 — 응답이 뒤섞여 와도 숫자가 되돌아가지 않는다
      if (typeof data?.count === "number") {
        setCount((c) => Math.max(c, data.count));
      }
    } catch {
      // 네트워크 오류 시 silent — 로컬 카운트만 올라간 채로 유지
    }
  }, [api, slug]);

  // 페이지를 떠날 때 아직 못 보낸 연타를 흘리지 않는다
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);

  function press() {
    if (maxed) return;

    setCount((c) => c + 1);
    setMine((m) => {
      const next = m + 1;
      localStorage.setItem(storeKey, String(next));
      return next;
    });

    pending.current += 1;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void flush();
    }, FLUSH_MS);

    const newHearts: FloatingHeart[] = Array.from({ length: 5 }, () => ({
      id: counter.current++,
      x: Math.random() * 70 - 35,
      size: 10 + Math.random() * 10,
      duration: 700 + Math.random() * 500,
      delay: Math.random() * 200,
    }));
    setHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts((prev) =>
        prev.filter((h) => !newHearts.find((n) => n.id === h.id)),
      );
    }, 1200);
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <style>{`
          @keyframes floatHeart {
            0%   { opacity: 1; transform: translateY(0) scale(1); }
            80%  { opacity: 0.6; }
            100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
          }
        `}</style>

        {hearts.map((h) => (
          <span
            key={h.id}
            className="pointer-events-none absolute bottom-full"
            style={{
              left: `calc(50% + ${h.x}px)`,
              animation: `floatHeart ${h.duration}ms ease-out ${h.delay}ms forwards`,
              opacity: 0,
            }}
          >
            <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill="#ef4444">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
        ))}

        <button
          type="button"
          onClick={press}
          disabled={maxed}
          aria-label={maxed ? "좋아요를 모두 눌렀습니다" : "좋아요"}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 transition-colors ${
            liked
              ? "border-red-300 bg-red-50 hover:bg-red-100"
              : "border-zinc-200 bg-paper hover:border-red-300 hover:bg-red-50"
          } ${maxed ? "cursor-not-allowed opacity-70 hover:bg-red-50" : ""}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={liked ? "#ef4444" : "none"}
            stroke={liked ? "#ef4444" : "currentColor"}
            strokeWidth="2"
            className="flex-shrink-0 transition-colors"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span
            className={`text-sm font-semibold ${
              liked ? "text-red-500" : "text-zinc-600"
            }`}
          >
            좋아요
          </span>
        </button>
      </div>

      <span className="text-[11px] text-zinc-400">
        {maxed
          ? "고맙습니다! 마음 잘 받았습니다"
          : `여러 번 눌러도 됩니다 (${mine}/${MAX_PER_VISITOR})`}
      </span>
      {count > 0 && (
        <span className="text-[11px] text-zinc-500">
          {count}개의 관심을 받았습니다
        </span>
      )}
    </div>
  );
}
