import { SceneCourses, type CourseCard } from "@/components/home/scenes/scene-courses";
import { SceneCta } from "@/components/home/scenes/scene-cta";
import { SceneHero } from "@/components/home/scenes/scene-hero";
import { SceneInsights, type InsightCard } from "@/components/home/scenes/scene-insights";
import { ScenePartners } from "@/components/home/scenes/scene-partners";
import { SceneProcess } from "@/components/home/scenes/scene-process";
import { SceneRentals } from "@/components/home/scenes/scene-rentals";
import { fetchCourses } from "@/lib/courses";
import { fetchInsights } from "@/lib/insights";

// 추천 과정·최신 인사이트가 재배포 없이 갱신되도록 (insights 페이지와 동일 주기)
export const revalidate = 60;

const TRACK_PATTERN = /^\[([^\]]+)\]\s*/;

function splitTrack(title: string): { track: string; clean: string } {
  const m = title.match(TRACK_PATTERN);
  if (!m) return { track: "공개 과정", clean: title };
  return { track: m[1]!, clean: title.slice(m[0].length) };
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
    .map((c) => {
      const { track, clean } = splitTrack(c.title);
      return { slug: c.slug, track, clean, summary: c.summary };
    });

  const latestInsights: InsightCard[] = allInsights.slice(0, 3).map((i) => ({
    slug: i.slug,
    title: i.title,
    image_url: i.image_url,
    tags: i.tags,
    dateLabel: formatDate(i.published_at),
  }));

  return (
    <>
      <style>{`
        .ds-card { border: 1px solid #EAEAEA; }
        .ds-card-soft { box-shadow: 0 1px 2px rgba(15, 15, 15, 0.04); border: 1px solid #ECECEC; }
        .ds-card-lift { transition: transform 220ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 220ms cubic-bezier(0.2,0.8,0.2,1), border-color 220ms; }
        .ds-card-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(15,15,15,0.08); border-color: #DADADA; }
      `}</style>

      <SceneHero />
      <ScenePartners />
      <SceneProcess />
      <SceneInsights insights={latestInsights} />
      <SceneCourses courses={featuredCourses} />
      <SceneRentals />
      <SceneCta />
    </>
  );
}
