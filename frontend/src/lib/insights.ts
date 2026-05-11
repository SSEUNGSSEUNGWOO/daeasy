import "server-only";

export type InsightSource = {
  title: string;
  url: string;
  source_id: string | null;
};

export type InsightSummary = {
  slug: string;
  title: string;
  category: string;
  image_url: string | null;
  published_at: string;
  tags: string[];
  view_count: number;
};

export type InsightDetail = InsightSummary & {
  body: string;
  sources: InsightSource[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchInsights(): Promise<InsightSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/insights`);
  if (!res.ok) {
    throw new Error(`Failed to fetch insights: ${res.status}`);
  }
  return res.json();
}

export async function fetchInsight(slug: string): Promise<InsightDetail | null> {
  // Next.js 16의 page params와 generateMetadata params가 인코딩 상태가 다를 수 있어
  // decode 후 encode 한 번 — raw 한국어든 percent-encoded든 일관되게 정규화
  const safe = encodeURIComponent(decodeURIComponent(slug));
  const res = await fetch(`${API_BASE_URL}/api/v1/insights/${safe}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch insight ${slug}: ${res.status}`);
  }
  return res.json();
}
