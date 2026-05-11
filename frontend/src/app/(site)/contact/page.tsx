import { fetchCourses } from "@/lib/courses";

import { ContactForm } from "./contact-form";

export const metadata = {
  title: "교육 문의",
  description:
    "조직에 맞는 AI · 데이터 교육 도입 문의. 사전 인터뷰 후 맞춤 커리큘럼 제안서를 일주일 내 보내드립니다.",
};

export default async function ContactPage() {
  const courses = await fetchCourses();
  const courseOptions = courses.map((c) => ({ slug: c.slug, title: c.title }));

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 lg:px-10 lg:pb-16 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Get in touch
          </p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-[#0F0F0F] sm:text-[56px] lg:text-[64px]">
            교육 문의.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            <strong className="text-[#0F0F0F]">상담은 무료입니다.</strong>{" "}
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
                Talk to us
              </p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#0F0F0F] sm:text-[40px]">
                이야기부터<br />시작합시다.
              </h2>
              <p className="mt-7 text-[16px] leading-[1.85] text-zinc-700">
                조직 규모, 산업, 학습 목표를 공유해주시면 가장 잘 맞는 과정을 제안드립니다.
                급하신 경우 아래 연락처로 직접 문의해주세요.
              </p>
              <div className="mt-8 space-y-3">
                <a
                  href="tel:070-5066-0995"
                  className="flex items-baseline gap-3 text-[15px] text-zinc-800 hover:text-[#0F0F0F]"
                >
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Tel
                  </span>
                  <span className="font-medium">070-5066-0995</span>
                </a>
                <a
                  href="mailto:data-edu@kbrainc.com"
                  className="flex items-baseline gap-3 text-[15px] text-zinc-800 hover:text-[#0F0F0F]"
                >
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Mail
                  </span>
                  <span className="font-medium">data-edu@kbrainc.com</span>
                </a>
                <div className="flex items-baseline gap-3 text-[15px] text-zinc-700">
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    시간
                  </span>
                  <span>평일 10:00 ~ 18:00</span>
                </div>
              </div>
            </div>
            <ContactForm courses={courseOptions} />
          </div>
        </div>
      </section>
    </>
  );
}
