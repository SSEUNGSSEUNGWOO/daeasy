import { fetchCourses } from "@/lib/courses";

import { ContactForm } from "./contact-form";
import { CONTACT_EMAIL, OFFICE_HOURS } from "@/lib/site";

export const metadata = {
  title: "교육 문의",
  description:
    "조직에 맞는 AI · 데이터 교육 도입 문의. 사전 인터뷰 후 맞춤 커리큘럼 제안서를 일주일 내 보내드립니다.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const [courses, sp] = await Promise.all([fetchCourses(), searchParams]);
  const courseOptions = courses.map((c) => ({ slug: c.slug, title: c.title }));
  // /quiz/report 리포트 추천에서 넘어온 경우 해당 과정을 미리 선택
  const defaultCourseSlug =
    sp.course && courseOptions.some((c) => c.slug === sp.course) ? sp.course : "";

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 lg:px-10 lg:pb-16 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            교육 문의
          </p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
            교육 문의.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            <strong className="text-ink">상담은 무료입니다.</strong>{" "}
            사전 인터뷰 후 맞춤 커리큘럼 제안서를 일주일 내 보내드립니다.
          </p>
        </div>
      </section>

      {/* 폼 + 사이드 정보 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20 reveal">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                연락처
              </p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[40px]">
                무엇이 필요한지<br />아직 정하지 않으셨어도 됩니다.
              </h2>
              <p className="mt-7 text-[16px] leading-[1.85] text-zinc-700">
                조직 규모, 산업, 학습 목표를 공유해주시면 가장 잘 맞는 과정을 제안드립니다.
                아래 폼으로 보내주시면 담당자가 영업일 기준 1일 이내로 회신드립니다.
              </p>
              <div className="mt-8 space-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-baseline gap-3 text-[15px] text-zinc-800 hover:text-ink"
                >
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    메일
                  </span>
                  <span className="font-medium">{CONTACT_EMAIL}</span>
                </a>
                <div className="flex items-baseline gap-3 text-[15px] text-zinc-700">
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    문의 응대
                  </span>
                  <span>{OFFICE_HOURS}</span>
                </div>
              </div>
              {/* 폼만 있으면 차갑다 — 교육 현장 사진(후기 페이지와 공유) + 약속 한 줄 */}
              <figure className="relative mt-10 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/reviews/public-genai-2026-h1-02.jpg"
                  alt="생성형 AI 실습 교육 현장"
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-6 pb-5 pt-14 text-white">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-blue-200">
                    문의 후 일주일
                  </p>
                  <p className="mt-1 text-[17px] font-bold leading-[1.4]">
                    사전 인터뷰를 거쳐 조직에 맞춘 커리큘럼 제안서를 보내드립니다.
                  </p>
                </figcaption>
              </figure>
            </div>
            <ContactForm courses={courseOptions} defaultCourseSlug={defaultCourseSlug} />
          </div>
        </div>
      </section>
    </>
  );
}
