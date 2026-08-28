"use client";

import { useEffect } from "react";

// 인사이트·교육후기가 같은 트래커를 공유한다 — API 경로만 리소스별로 다르다
export function ViewTracker({
  slug,
  resource = "insights",
}: {
  slug: string;
  resource?: "insights" | "cases";
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch(`/api/${resource}/${encodeURIComponent(slug)}/views`, {
      method: "POST",
    }).catch(() => {});
  }, [slug, resource]);
  return null;
}
