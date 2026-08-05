import Link from "next/link";

export const metadata = {
  title: "AI 챔피언",
  description:
    "행정안전부 공공부문 AI 챔피언 프로그램 — 케이브레인컴퍼니가 역량 평가(CBT)부터 화상 감독, 채점, 인증까지 전 과정을 운영합니다.",
};

const scopes = [
  {
    tag: "01",
    title: "역량 평가 (CBT)",
    body: "공공부문 AI 역량을 검증하는 컴퓨터 기반 평가. 문제은행 관리부터 응시 환경까지 직접 운영합니다.",
  },
  {
    tag: "02",
    title: "실시간 화상 감독",
    body: "원격 응시를 실시간 화상으로 감독하고, 이상 징후를 리뷰하는 감독 체계를 운영합니다.",
  },
  {
    tag: "03",
    title: "채점 · 심사",
    body: "표준화된 기준에 따른 채점과 심사 프로세스로 평가의 공정성을 관리합니다.",
  },
  {
    tag: "04",
    title: "인증 · 통계",
    body: "인증서 발급과 인증 현황 조회, 운영 통계까지 — 평가 이후의 관리를 책임집니다.",
  },
];

export default function AiChampionPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-white to-white" />
        <div className="mx-auto max-w-[1280px] px-6 pb-16 pt-20 lg:px-10 lg:pb-20 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Public Program</p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
            AI 챔피언.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            <strong className="text-ink">행정안전부 공공부문 AI 챔피언 프로그램.</strong>{" "}
            케이브레인컴퍼니가 역량 평가부터 인증까지 전 과정을 운영합니다.
          </p>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.8] text-zinc-600">
            공공부문의 AI 역량을 검증하는 국가 단위 프로그램을 운영한다는 것 — 공공이 요구하는 AI 역량의 기준을 현장에서 가장 가까이 보고 있다는 뜻입니다.
          </p>
        </div>
      </section>

      {/* 운영 범위 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">What we operate</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              평가부터 인증까지,<br />전 과정을 운영합니다.
            </h2>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 reveal-stagger">
            {scopes.map((s) => (
              <li key={s.tag} className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
                <p className="font-mono text-[11.5px] font-bold tracking-[0.18em] text-accent">
                  {s.tag}
                </p>
                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-ink">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 교육 연계 CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="rounded-3xl bg-ink-warm p-10 text-white sm:p-16 lg:p-20">
            <div className="grid grid-cols-12 gap-x-8 gap-y-8">
              <div className="col-span-12 lg:col-span-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
                  Education × Certification
                </p>
                <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[48px]">
                  기준을 아는 곳이<br />가르칩니다.
                </h2>
                <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-zinc-300">
                  공공부문 AI 역량의 평가 기준을 운영하는 회사가 교육을 설계합니다. 조직에 필요한 역량이 무엇인지부터 이야기해 보세요.
                </p>
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
