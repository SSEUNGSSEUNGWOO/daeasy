import { SceneCourses, type CourseCard } from "@/components/home/scenes/scene-courses";
import { SceneCourseOutputs } from "@/components/home/scenes/scene-course-outputs";
import { SceneCta } from "@/components/home/scenes/scene-cta";
import { SceneAiChampion } from "@/components/home/scenes/scene-ai-champion";
import { SceneHero } from "@/components/home/scenes/scene-hero";
import { SceneInsights, type InsightCard } from "@/components/home/scenes/scene-insights";
import { ScenePartners } from "@/components/home/scenes/scene-partners";
import { SceneRentals } from "@/components/home/scenes/scene-rentals";
import { fetchCourses } from "@/lib/courses";
import { fetchInsights } from "@/lib/insights";

// 추천 과정·최신 인사이트가 재배포 없이 갱신되도록 (insights 페이지와 동일 주기)
export const revalidate = 60;

const TRACK_PATTERN = /^\[([^\]]+)\]\s*/;

const LEVEL_LABELS = { beginner: "초급", intermediate: "중급", advanced: "고급" } as const;

function stripTrack(title: string): string {
  return title.replace(TRACK_PATTERN, "");
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function formatDate(value: string) {
  return dateFormatter.format(new Date(value)).replace(/\.\s?$/, "").replace(/\.\s/g, ".");
}

export default async function HomePage() {
  const [allCourses, allInsights] = await Promise.all([
    fetchCourses(),
    fetchInsights(),
  ]);

  // 장면 컴포넌트(client)에는 직렬화 가능한 표시용 데이터만 내린다.
  const featuredCourses: CourseCard[] = allCourses
    .filter((c) => c.title.includes("[표준 과정]"))
    .slice(0, 6)
    .map((c) => ({
      slug: c.slug,
      clean: stripTrack(c.title),
      summary: c.summary,
      levelLabel: LEVEL_LABELS[c.level],
      hours: c.duration_hours,
    }));

  const latestInsights: InsightCard[] = allInsights.slice(0, 3).map((i) => ({
    slug: i.slug,
    title: i.title,
    image_url: i.image_url,
    tags: i.tags,
    dateLabel: formatDate(i.published_at),
  }));

  return (
    <>
      <SceneHero />
      <SceneCourses courses={featuredCourses} />
      <SceneCourseOutputs />
      <ScenePartners />
      <SceneAiChampion />
      <SceneInsights insights={latestInsights} />
      <SceneRentals />
      <SceneCta />
    </>
  );
}
