import "server-only";

import { supabase } from "@/lib/supabase";

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
  like_count: number;
};

export type InsightDetail = InsightSummary & {
  body: string;
  sources: InsightSource[];
};

const LIST_COLUMNS =
  "slug,title,category,image_url,published_at,tags,view_count";
const DETAIL_COLUMNS = `${LIST_COLUMNS},body,sources`;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function fetchInsights(): Promise<InsightSummary[]> {
  const [{ data, error }, likesRes] = await Promise.all([
    supabase
      .from("insights")
      .select(LIST_COLUMNS)
      .order("published_at", { ascending: false }),
    supabase.from("insight_likes").select("slug"),
  ]);
  if (error) throw new Error(`Failed to fetch insights: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of (likesRes.data ?? []) as { slug: string }[]) {
    counts.set(row.slug, (counts.get(row.slug) ?? 0) + 1);
  }

  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    title: (row.title as string) ?? "",
    category: (row.category as string) ?? "",
    image_url: (row.image_url as string | null) ?? null,
    published_at: row.published_at as string,
    tags: asArray<string>(row.tags),
    view_count: (row.view_count as number) ?? 0,
    like_count: counts.get(row.slug as string) ?? 0,
  }));
}

export async function fetchInsight(slug: string): Promise<InsightDetail | null> {
  const safe = decodeURIComponent(slug);
  const [{ data, error }, likesRes] = await Promise.all([
    supabase
      .from("insights")
      .select(DETAIL_COLUMNS)
      .eq("slug", safe)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("insight_likes")
      .select("*", { count: "exact", head: true })
      .eq("slug", safe),
  ]);
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch insight ${slug}: ${error.message}`);
  }
  if (!data) return null;

  return {
    slug: data.slug as string,
    title: (data.title as string) ?? "",
    category: (data.category as string) ?? "",
    image_url: (data.image_url as string | null) ?? null,
    published_at: data.published_at as string,
    tags: asArray<string>(data.tags),
    view_count: (data.view_count as number) ?? 0,
    like_count: likesRes.count ?? 0,
    body: (data.body as string) ?? "",
    sources: asArray<InsightSource>(data.sources),
  };
}
