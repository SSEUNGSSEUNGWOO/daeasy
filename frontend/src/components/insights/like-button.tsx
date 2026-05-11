"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type FloatingHeart = {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
};

export function LikeButton({ slug }: { slug: string }) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const counter = useRef(0);
  const sessionKey = `liked_insight_${slug}`;

  useEffect(() => {
    fetch(
      `${API_BASE}/api/v1/insights/${encodeURIComponent(slug)}/likes`,
    )
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => {});
    if (typeof window !== "undefined") {
      // sessionStorage는 client-only — SSR 후 hydrate 시점에 동기화. cascading render 1회뿐이라 안전.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiked(!!sessionStorage.getItem(sessionKey));
    }
  }, [slug, sessionKey]);

  async function press() {
    setCount((c) => c + 1);
    setLiked(true);
    sessionStorage.setItem(sessionKey, "1");

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

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/insights/${encodeURIComponent(slug)}/likes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const data = await res.json();
      if (typeof data?.count === "number") setCount(data.count);
    } catch {
      // 네트워크 오류 시 silent — 로컬 카운트만 업데이트된 채로 유지
    }
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
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 transition-colors ${
            liked
              ? "border-red-300 bg-red-50 hover:bg-red-100"
              : "border-zinc-200 bg-[#F5F1E8] hover:border-red-300 hover:bg-red-50"
          }`}
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

      <span className="text-[11px] text-zinc-400">마음에 드는 만큼 눌러주세요</span>
      {count > 0 && (
        <span className="text-[11px] text-zinc-500">
          {count}개의 관심을 받았습니다
        </span>
      )}
    </div>
  );
}
