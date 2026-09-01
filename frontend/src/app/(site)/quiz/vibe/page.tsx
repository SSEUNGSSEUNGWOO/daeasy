import { fetchCourses } from "@/lib/courses";

import { VibeFlow, type VibeCourse } from "./vibe-flow";

// 어드민에서 과정이 바뀌면 추천 카드도 따라가도록
export const revalidate = 60;

export const metadata = {
  title: "바이브 코딩 라이브",
  description:
    "만들고 싶은 것을 한 줄만 적으면 AI가 눈앞에서 코드를 쓰고, 실제로 동작하는 웹앱을 바로 보여드립니다.",
};

export default async function VibeStationPage() {
  const courses: VibeCourse[] = (await fetchCourses()).map((c) => ({
    slug: c.slug,
    title: c.title,
    level: c.level,
  }));

  return (
    <section className="bg-zinc-50/40">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          AI 체험관 · STATION 02
        </p>
        <h1 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          바이브 코딩 라이브
        </h1>
        <p className="mt-6 text-[17px] leading-[1.75] text-zinc-700">
          뭘 만들어볼까요? 한 줄만 적어주시면 AI가 지금 이 자리에서 코드를 쓰고,
          완성되는 순간 실제로 동작하는 화면을 보여드립니다.
        </p>

        <VibeFlow courses={courses} />
      </div>
    </section>
  );
}
