import "server-only";

import { supabase } from "@/lib/supabase";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CourseSummary = {
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  duration_hours: number;
  price: number | null;
  thumbnail_url: string | null;
  sort_order: number;
};

export type CourseDetail = CourseSummary & {
  description: string;
};

const LIST_COLUMNS =
  "slug,title,summary,level,duration_hours,price,thumbnail_url,sort_order";
const DETAIL_COLUMNS = `${LIST_COLUMNS},description`;

export async function fetchCourses(): Promise<CourseSummary[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);

  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    title: (row.title as string) ?? "",
    summary: (row.summary as string) ?? "",
    level: row.level as CourseLevel,
    duration_hours: (row.duration_hours as number) ?? 0,
    price: (row.price as number | null) ?? null,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    sort_order: (row.sort_order as number) ?? 0,
  }));
}

export async function fetchCourse(slug: string): Promise<CourseDetail | null> {
  const safe = decodeURIComponent(slug);
  const { data, error } = await supabase
    .from("courses")
    .select(DETAIL_COLUMNS)
    .eq("slug", safe)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch course ${slug}: ${error.message}`);
  }
  if (!data) return null;

  return {
    slug: data.slug as string,
    title: (data.title as string) ?? "",
    summary: (data.summary as string) ?? "",
    level: data.level as CourseLevel,
    duration_hours: (data.duration_hours as number) ?? 0,
    price: (data.price as number | null) ?? null,
    thumbnail_url: (data.thumbnail_url as string | null) ?? null,
    sort_order: (data.sort_order as number) ?? 0,
    description: (data.description as string) ?? "",
  };
}
