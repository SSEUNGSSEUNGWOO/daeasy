"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch(`/api/insights/${encodeURIComponent(slug)}/views`, {
      method: "POST",
    }).catch(() => {});
  }, [slug]);
  return null;
}
