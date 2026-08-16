import { fetchCourses } from "@/lib/courses";

import { QuizFlow, type QuizCourse } from "./quiz-flow";

// 어드민에서 과정이 바뀌면 추천 후보도 따라가도록
export const revalidate = 60;

export const metadata = {
  title: "교육 추천",
  description: "조직 · 역할 · 수준 · 목표 4가지 질문에 답하면 32개 과정 중 맞는 교육을 추천해 드립니다.",
};

export default async function QuizPage() {
  const courses: QuizCourse[] = (await fetchCourses()).map((c) => ({
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    level: c.level,
  }));

  return (
    <section className="bg-zinc-50/40">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">교육 추천</p>
        <h1 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          내게 맞는 교육 찾기
        </h1>
        <p className="mt-6 text-[17px] leading-[1.75] text-zinc-700">
          네 가지 질문에 답하면, 직무 · 수준 · 목표에 맞는 교육과정을 추천해 드립니다.
        </p>

        <QuizFlow courses={courses} />
      </div>
    </section>
  );
}
