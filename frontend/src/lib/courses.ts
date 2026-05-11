import "server-only";

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type CourseDetail = CourseSummary & {
  description: string;
};

export async function fetchCourses(): Promise<CourseSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/courses`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch courses: ${res.status}`);
  }
  return res.json();
}

export async function fetchCourse(slug: string): Promise<CourseDetail | null> {
  const safe = encodeURIComponent(decodeURIComponent(slug));
  const res = await fetch(`${API_BASE_URL}/api/v1/courses/${safe}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch course ${slug}: ${res.status}`);
  }
  return res.json();
}
