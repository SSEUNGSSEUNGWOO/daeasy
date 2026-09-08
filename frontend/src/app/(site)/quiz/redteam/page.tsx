import { fetchCourses } from "@/lib/courses";

import { RedteamFlow, type RedteamCourse } from "./redteam-flow";

// 어드민에서 과정이 바뀌면 추천 카드도 따라가도록
export const revalidate = 60;

export const metadata = {
  title: "레드팀 게임",
  description:
    "규칙이 걸린 공공 챗봇을 직접 뚫어보며 배우는 AI 보안 감각 — 사회공학, 문서 속 지시, 도구 오남용, 설정 유출, 확신 유도 5라운드.",
};

export default async function RedteamStationPage() {
  const courses: RedteamCourse[] = (await fetchCourses()).map((c) => ({
    slug: c.slug,
    title: c.title,
    level: c.level,
  }));

  return (
    <section className="bg-zinc-50/40">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          AI 체험관 · STATION 03
        </p>
        <h1 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          레드팀 게임
        </h1>
        <p className="mt-6 text-[17px] leading-[1.75] text-zinc-700">
          규칙이 걸린 공공 챗봇 다섯 대가 있습니다. 어떤 말이 규칙을 뚫는지
          직접 골라보세요 — 뚫리는 이유를 알면 막는 법이 보입니다.
        </p>

        <RedteamFlow courses={courses} />
      </div>
    </section>
  );
}
