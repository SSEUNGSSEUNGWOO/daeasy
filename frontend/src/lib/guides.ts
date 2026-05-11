import "server-only";

export type GuideVideo = {
  title: string | null;
  url: string;
  channel: string | null;
};

export type GuideImage = {
  id: string | null;
  type: string | null;
  description: string | null;
  url: string | null;
};

export type GuideSummary = {
  slug: string;
  title: string;
  summary: string;
  cover_url: string | null;
  category: string;
  difficulty: string;
  tags: string[];
  published_at: string | null;
};

export type GuideDetail = GuideSummary & {
  body: string;
  tldr: string[];
  videos: GuideVideo[];
  images: GuideImage[];
  evaluation_score: number | null;
  author_name: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchGuides(): Promise<GuideSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/guides`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch guides: ${res.status}`);
  return res.json();
}

export async function fetchGuide(slug: string): Promise<GuideDetail | null> {
  const safe = encodeURIComponent(decodeURIComponent(slug));
  const res = await fetch(`${API_BASE_URL}/api/v1/guides/${safe}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch guide ${slug}: ${res.status}`);
  return res.json();
}
