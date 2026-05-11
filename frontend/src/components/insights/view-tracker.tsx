"use client";

import { useEffect } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `viewed_insight_${slug}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
    fetch(
      `${API_BASE}/api/v1/insights/${encodeURIComponent(slug)}/views`,
      { method: "POST" },
    ).catch(() => {});
  }, [slug]);
  return null;
}
