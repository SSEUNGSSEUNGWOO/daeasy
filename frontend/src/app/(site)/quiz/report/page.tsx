import { fetchCourses } from "@/lib/courses";

import { ReportFlow, type ReportCourse } from "./report-flow";

// 어드민에서 과정이 바뀌면 추천 카드도 따라가도록
export const revalidate = 60;

export const metadata = {
  title: "내 업무 AI 리포트",
  description:
    "업무를 한 줄만 적으면 AI가 자동화 포인트와 절감 시간, 보안 주의까지 맞춤 리포트를 실시간으로 작성합니다.",
};

export default async function ReportStationPage() {
  const courses: ReportCourse[] = (await fetchCourses()).map((c) => ({
    slug: c.slug,
    title: c.title,
    level: c.level,
  }));

  return (
    <section className="bg-zinc-50/40">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          AI 체험관 · STATION 01
        </p>
        <h1 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          내 업무 AI 리포트
        </h1>
        <p className="mt-6 text-[17px] leading-[1.75] text-zinc-700">
          어떤 일을 하고 계신가요? 한 줄만 적어주시면 AI가 지금 이 자리에서
          맞춤 리포트를 씁니다.
        </p>

        <ReportFlow courses={courses} />
      </div>
    </section>
  );
}
