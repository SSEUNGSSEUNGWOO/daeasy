import "server-only";

import { supabase } from "@/lib/supabase";

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

const LIST_COLUMNS =
  "slug,title,summary,cover_url,category,difficulty,tags,published_at";
const DETAIL_COLUMNS = `${LIST_COLUMNS},body,tldr,videos,images,evaluation_score,author_name`;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function fetchGuides(): Promise<GuideSummary[]> {
  const { data, error } = await supabase
    .from("guides")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch guides: ${error.message}`);

  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    title: (row.title as string) ?? "",
    summary: (row.summary as string) ?? "",
    cover_url: (row.cover_url as string | null) ?? null,
    category: (row.category as string) ?? "",
    difficulty: (row.difficulty as string) ?? "",
    tags: asArray<string>(row.tags),
    published_at: (row.published_at as string | null) ?? null,
  }));
}

export async function fetchGuide(slug: string): Promise<GuideDetail | null> {
  const safe = decodeURIComponent(slug);
  const { data, error } = await supabase
    .from("guides")
    .select(DETAIL_COLUMNS)
    .eq("slug", safe)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch guide ${slug}: ${error.message}`);
  }
  if (!data) return null;

  return {
    slug: data.slug as string,
    title: (data.title as string) ?? "",
    summary: (data.summary as string) ?? "",
    cover_url: (data.cover_url as string | null) ?? null,
    category: (data.category as string) ?? "",
    difficulty: (data.difficulty as string) ?? "",
    tags: asArray<string>(data.tags),
    published_at: (data.published_at as string | null) ?? null,
    body: (data.body as string) ?? "",
    tldr: asArray<string>(data.tldr),
    videos: asArray<GuideVideo>(data.videos),
    images: asArray<GuideImage>(data.images),
    evaluation_score: (data.evaluation_score as number | null) ?? null,
    author_name: (data.author_name as string | null) ?? null,
  };
}
