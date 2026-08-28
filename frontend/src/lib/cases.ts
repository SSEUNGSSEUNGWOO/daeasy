import "server-only";

import { supabase } from "@/lib/supabase";

export type CaseSummary = {
  slug: string;
  title: string;
  summary: string;
  client_name: string | null;
  conducted_at: string | null;
  thumbnail_url: string | null;
};

export type CaseDetail = CaseSummary & {
  description: string;
  view_count: number;
};

const LIST_COLUMNS =
  "slug,title,summary,client_name,conducted_at,thumbnail_url";
const DETAIL_COLUMNS = `${LIST_COLUMNS},description,view_count`;

export async function fetchCases(): Promise<CaseSummary[]> {
  const { data, error } = await supabase
    .from("cases")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("conducted_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch cases: ${error.message}`);

  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    title: (row.title as string) ?? "",
    summary: (row.summary as string) ?? "",
    client_name: (row.client_name as string | null) ?? null,
    conducted_at: (row.conducted_at as string | null) ?? null,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
  }));
}

export async function fetchCase(slug: string): Promise<CaseDetail | null> {
  const safe = decodeURIComponent(slug);
  const { data, error } = await supabase
    .from("cases")
    .select(DETAIL_COLUMNS)
    .eq("slug", safe)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch case ${slug}: ${error.message}`);
  }
  if (!data) return null;

  return {
    slug: data.slug as string,
    title: (data.title as string) ?? "",
    summary: (data.summary as string) ?? "",
    client_name: (data.client_name as string | null) ?? null,
    conducted_at: (data.conducted_at as string | null) ?? null,
    thumbnail_url: (data.thumbnail_url as string | null) ?? null,
    description: (data.description as string) ?? "",
    view_count: (data.view_count as number) ?? 0,
  };
}

/** 교육후기 좋아요 수. 표시용이므로 조회 실패 시 0 으로 조용히 폴백한다. */
export async function fetchCaseLikeCount(slug: string): Promise<number> {
  const safe = decodeURIComponent(slug);
  const { count, error } = await supabase
    .from("case_likes")
    .select("*", { count: "exact", head: true })
    .eq("slug", safe);
  if (error) return 0;
  return count ?? 0;
}
