import type { MetadataRoute } from "next";

import { fetchCases } from "@/lib/cases";
import { fetchCourses } from "@/lib/courses";
import { fetchInsights } from "@/lib/insights";
import { SITE_URL } from "@/lib/site";

// 새로 발행된 콘텐츠가 사이트맵에 잡히도록 목록 페이지와 같은 주기로 재생성
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/ai-champion",
    "/courses",
    "/cases",
    "/insights",
    "/contact",
    "/rentals",
    "/support",
    "/quiz",
    "/quiz/report",
    "/quiz/vibe",
    "/privacy",
  ].map((path) => ({ url: `${SITE_URL}${path}` }));

  // anon 클라이언트 경유라 RLS 가 published 만 내준다 — draft 는 사이트맵에 안 실린다
  const [courses, cases, insights] = await Promise.all([
    fetchCourses(),
    fetchCases(),
    fetchInsights(),
  ]);

  const entry = (path: string, slug: string, lastModified?: string | null) => ({
    url: `${SITE_URL}${path}/${encodeURIComponent(slug)}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  });

  return [
    ...staticPages,
    ...courses.map((c) => entry("/courses", c.slug)),
    ...cases.map((c) => entry("/cases", c.slug)),
    ...insights.map((i) => entry("/insights", i.slug, i.published_at)),
  ];
}
