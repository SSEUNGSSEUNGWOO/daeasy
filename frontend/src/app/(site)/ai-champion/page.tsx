import type { Metadata } from "next";
import Link from "next/link";

import { JourneySection } from "@/components/ai-champion/journey-section";
import { ScorePanel } from "@/components/ai-champion/score-panel";
import { TrackPanels } from "@/components/ai-champion/track-panels";

export const metadata: Metadata = {
  // "AI 챔피언" 검색 노출을 노리는 페이지 — 제목에 프로그램 주체(행정안전부)와
  // 성격(공공부문 교육·인증)을 함께 넣어야 검색 결과에서 무엇인지 바로 읽힌다
  title: "AI 챔피언 교육 — 행정안전부 공공부문 AI 인재 양성·인증",
  description:
    "행정안전부·NIA 공공부문 AI 챔피언 프로그램 운영사 데이지(DAEASY). 공무원·공공기관 임직원 대상 Green·Blue·Black 3단계 인증 체계와 교육 과정, 운영 경험과 범위를 확인하세요.",
  keywords: [
    "AI 챔피언",
    "AI 챔피언 교육",
    "AI 챔피언 자격",
    "행정안전부 AI 챔피언",
    "공공부문 AI 교육",
    "공무원 AI 교육",
  ],
  openGraph: {
    title: "AI 챔피언 교육 — 행정안전부 공공부문 AI 인재 양성·인증",
    description:
      "Green·Blue·Black 3단계 인증 체계와 교육 과정, 운영 경험과 범위를 확인하세요.",
    type: "website",
  },
};

const heroTracks = [
  ["Green", "실무 기획자", "bg-emerald-400"],
  ["Blue", "AI 전환 실행자", "bg-blue-400"],
  ["Black", "AI 거점 리더", "bg-zinc-300"],
] as const;

const assessmentAreas = [
  {
    title: "생성형 AI 활용",
    body: "행정문서와 콘텐츠를 목적에 맞게 생성·재구성하고 결과를 검증하는 역량",
  },
  {
    title: "데이터 분석",
    body: "공공데이터를 정제·분석하고 근거 있는 해석과 인사이트를 도출하는 역량",
  },
  {
    title: "서비스 구현",
    body: "AI 도구와 관련 기술을 활용해 실제 동작하는 웹서비스와 자동화 도구를 구현하는 역량",
  },
] as const;

const operationScopes = [
  ["역량체계 설계", "역량진단 모델과 평가 지표 개발"],
  ["교육 운영", "종합과정 운영과 학습·과제 지원"],
  ["인증평가", "CBT, 본인확인, 실시간 화상 감독"],
  ["결과 관리", "채점·심사, 통계와 인증 운영 지원"],
] as const;

export default function AiChampionPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink-warm text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.3),transparent_38%)]" />
        {/* 3단계 등급 비주얼 — 가장자리가 투명하게 페이드된 이미지라 배경색과 섞인다.
            xl 미만에서는 헤드라인이 줄바꿈되며 텍스트와 겹치므로 숨긴다 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden xl:block">
          <div className="relative mx-auto h-full max-w-[1280px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ai-champion/hero-tiers.webp"
              alt=""
              className="absolute -bottom-16 -right-16 w-[560px] opacity-90"
            />
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <p className="anim-page-fade-up text-[13px] font-bold uppercase tracking-[0.2em] text-blue-300">공공 AI 인재</p>
          <h1 className="mt-5 max-w-5xl text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[60px] lg:text-[72px]">
            <span className="anim-page-fade-up block" style={{ animationDelay: "140ms" }}>
              공공행정 현장의 AI 전환을 이끄는
            </span>
            <span className="anim-page-fade-up block" style={{ animationDelay: "260ms" }}>
              실무 인재, AI 챔피언
            </span>
          </h1>
          <p
            className="anim-page-fade-up mt-8 max-w-3xl text-[17px] leading-[1.8] text-zinc-300 sm:text-[19px]"
            style={{ animationDelay: "380ms" }}
          >
            AI 챔피언은 <strong className="font-bold text-white">공무원과 공공기관 임직원을 대상으로</strong>{" "}
            공공행정 현장의 문제를 AI와 데이터로 해결하고 기관의 변화를 주도할
            실무 인재를 양성·인증하는 제도입니다.
          </p>
          <div className="mt-10 flex flex-wrap gap-3" aria-label="AI 챔피언 인증 등급">
            {heroTracks.map(([name, role, dot], index) => (
              <span
                key={name}
                className="anim-page-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-bold backdrop-blur-sm"
                style={{ animationDelay: `${480 + index * 90}ms` }}
              >
                <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
                {name} · {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">세 개의 등급</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
              기획에서 구현으로,<br />구현에서 조직의 확산으로.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.8] text-zinc-600">
              역할과 숙련도에 따라 Green·Blue·Black 세 등급으로 성장합니다. 등급을 선택해 자세히 보세요.
            </p>
          </div>
          <TrackPanels />
        </div>
      </section>

      <JourneySection />

      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <h2 className="text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
                실제 업무형 과제로<br />세 가지 역량을 평가합니다.
              </h2>
              <p className="mt-5 text-[16px] leading-[1.8] text-zinc-600">
                Green과 Blue는 같은 영역을 평가하되 역할과 숙련도에 맞춰 요구 수준을 다르게 적용합니다.
              </p>
              <ScorePanel />
            </div>
            <div className="grid content-center gap-9">
              {assessmentAreas.map((area) => (
                <article
                  key={area.title}
                  className="group border-l-2 border-zinc-200 pl-6 transition-colors duration-300 hover:border-accent motion-reduce:transition-none"
                >
                  <h3 className="text-[20px] font-bold text-ink transition-colors duration-300 group-hover:text-accent motion-reduce:transition-none">
                    {area.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-[1.75] text-zinc-600">{area.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">데이지의 운영 경험</p>
              <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
                2025년 시범사업부터<br />설계와 운영을 함께해 왔습니다.
              </h2>
              <p className="mt-5 max-w-xl text-[16px] leading-[1.8] text-zinc-600">
                DAEASY는 역량진단 모델과 평가 지표를 직접 개발했고, 2026년에도 종합과정과
                인증평가 운영을 이어가고 있습니다.
              </p>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-200 sm:grid-cols-2">
              {operationScopes.map(([title, body]) => (
                <li key={title} className="bg-white p-7">
                  <h3 className="text-[17px] font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{body}</p>
                </li>
              ))}
            </ul>
          </div>
          {/* 수료·인증 실적 수치는 비공개 지침으로 싣지 않는다 (홈 scene-ai-champion 동일) */}
        </div>
      </section>

      <section className="bg-white px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-[1280px] rounded-3xl bg-ink-warm p-10 text-white sm:p-16 lg:p-20 reveal">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-blue-300">교육 × 인증</p>
              <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[52px]">
                공공 현장에 필요한 AI 역량,<br />교육부터 적용까지 설계합니다.
              </h2>
              <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-zinc-300">
                기관의 직무와 목표에 맞는 AI·데이터 교육과 역량진단 운영을 상담해 보세요.
              </p>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              교육·운영 문의하기
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
