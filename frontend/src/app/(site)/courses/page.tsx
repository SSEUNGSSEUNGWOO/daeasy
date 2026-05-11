import Link from "next/link";

import { fetchCourses } from "@/lib/courses";

import { CoursesTabs } from "./courses-tabs";

export const metadata = {
  title: "교육과정",
  description:
    "데이터분석에 대한 맞춤형 교육 커리큘럼. 난이도별(초급/중급/고급) 32개 과정 — AI 리터러시부터 LLM 서비스 개발까지.",
};

export default async function CoursesPage() {
  const courses = await fetchCourses();

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 lg:px-10 lg:pb-16 lg:pt-24">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Program
          </p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-[#0F0F0F] sm:text-[56px] lg:text-[64px]">
            교육과정.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            데이터분석에 대한 맞춤형 교육 커리큘럼을 통해 데이터 분석을 쉽게 접근하고 배울 수 있도록 설계합니다.
          </p>
        </div>
      </section>

      {/* Tabs + 카드 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-10 lg:px-10 lg:pb-28">
          <CoursesTabs courses={courses} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="rounded-3xl bg-[#17150F] p-10 text-white sm:p-16 lg:p-20">
            <div className="grid grid-cols-12 gap-x-8 gap-y-8">
              <div className="col-span-12 lg:col-span-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
                  Get in touch
                </p>
                <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[48px]">
                  조직에 맞춘 교육,<br />이야기부터 시작합시다.
                </h2>
              </div>
              <div className="col-span-12 flex self-end lg:col-span-4 lg:justify-end">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90"
                >
                  교육 문의하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
