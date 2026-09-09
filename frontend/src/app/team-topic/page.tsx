import type { Metadata } from "next";
import Image from "next/image";

import { Reveal, RevealList } from "@/components/reveal";

import { TeamTopicBoard } from "./board";
import { NUM_FONT, TEAM_COUNT, TOPICS } from "./content";

// 교육생 배포용 임시 페이지 — 검색엔진 색인 제외
export const metadata: Metadata = {
  title: "팀 프로젝트 주제 제출",
  robots: { index: false, follow: false },
};

const STEPS = [
  ["주제·범위 선정", "한 조 = 한 주제. 대상 부처·지자체·이슈를 좁힙니다"],
  ["외부 데이터 확보", "공공데이터 API · 크롤링 · PDF 파싱 · 직접 수집"],
  ["AI 에이전트 분석", "MCP로 도구 호출, 비교·요약·이상탐지·교차검증"],
  ["시각화·인사이트", "지도·타임라인·네트워크·대시보드, 한 화면에서"],
  ["시연·문서화", "웹 프로토타입 + 데이터 소스 문서 + 5분 시연"],
] as const;

const RULES = [
  ["조 구성", "4명 1조 · 기획·데이터·개발·시연 역할 분담 자율"],
  ["데이터", "외부 데이터 중심 — 공공 API · 크롤링 · PDF"],
  ["도구", "바이브코딩 · 에이전트 · MCP · 컨텍스트"],
  ["산출물", "웹 프로토타입 + 데이터 소스 문서 + 5분 시연"],
] as const;

const STATS = [
  [String(TOPICS.length), "주제 예시"],
  [String(TEAM_COUNT), "개 조"],
  ["5", "단계"],
  ["5", "분 시연"],
] as const;

function SectionHead({ no, title, sub }: { no: string; title: string; sub?: string }) {
  return (
    <Reveal className="flex items-end gap-5">
      <span
        style={NUM_FONT}
        className="text-5xl font-extrabold leading-none tracking-[-0.04em] text-accent-warm sm:text-6xl"
      >
        {no}
      </span>
      <div className="pb-1">
        <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
    </Reveal>
  );
}

export default function TeamTopicPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ── 히어로: 크림 바탕 + 일러스트 ── */}
      <section className="relative overflow-hidden bg-[#fefaf2]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_420px_at_100%_0%,rgba(249,115,22,0.12),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[6fr_5fr] lg:gap-6">
          <div>
            <p
              style={NUM_FONT}
              className="anim-hero-fade text-[11px] font-bold uppercase tracking-[0.28em] text-accent-warm"
            >
              바이브코딩 팀 프로젝트
            </p>
            <h1 className="anim-page-fade-up mt-5 text-[clamp(2.5rem,6.5vw,4.6rem)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#1f3a93]">
              범정부 AI 서비스,
              <br />
              우리 조는
              <br />
              무엇을 만들까요<span className="text-accent-warm">?</span>
            </h1>
            <p className="anim-page-fade-up mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              외부 데이터를 수집·정제·분석해 국민·공무원·연구자에게 도움이 되는 범정부 AI
              서비스를 조별로 기획·구현·시연합니다. 예시는 참고일 뿐, 주제는 자유입니다.
            </p>
            <dl className="anim-hero-fade mt-10 grid grid-cols-4 gap-4">
              {STATS.map(([n, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="flex items-baseline gap-1.5">
                    <span
                      style={NUM_FONT}
                      className="text-3xl font-extrabold tracking-[-0.04em] text-[#1f3a93] sm:text-4xl"
                    >
                      {n}
                    </span>
                    <span className="text-xs text-slate-500 sm:text-sm">{label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="anim-cover-scale-fade relative mx-auto w-full max-w-[420px] lg:max-w-none">
            <Image
              src="/illust/quiz-vibe.webp"
              alt="노트북 화면의 플로차트와 날아가는 로켓 일러스트"
              width={640}
              height={640}
              priority
              className="h-auto w-full mix-blend-multiply"
            />
          </div>
        </div>
        {/* 핵심 질문 띠 */}
        <div className="bg-[#1f3a93] text-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-6 sm:px-8">
            <p
              style={NUM_FONT}
              className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-warm"
            >
              핵심 질문
            </p>
            <p className="text-xl font-bold leading-snug tracking-[-0.02em] sm:text-2xl">
              “이 서비스는 누구의 어떤 문제를 해결하나요?”
            </p>
            <p className="text-sm text-white/70 sm:ml-auto">한 문장으로 답할 수 있어야 합니다. 그 문장을 주제와 함께 아래에서 제출합니다.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 pb-40 sm:px-8">
        {/* ── 01 예시 ── */}
        <section className="pt-20 sm:pt-28">
          <SectionHead no="01" title="주제 예시 10선" sub="예시를 그대로 골라도, 대상과 문제를 바꿔 새 주제를 정해도 됩니다" />
          <RevealList className="mt-10 grid gap-x-10 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <li key={t.code} className="group relative border-t border-slate-200 py-6 pr-16">
                <span
                  aria-hidden
                  style={NUM_FONT}
                  className="absolute right-0 top-4 text-6xl font-extrabold leading-none tracking-[-0.06em] text-[#dde2f3] transition-colors duration-300 group-hover:text-accent-warm"
                >
                  {t.code}
                </span>
                <h3 className="text-lg font-bold tracking-[-0.01em]">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.q}</p>
                <p
                  style={NUM_FONT}
                  className="mt-3 text-[11px] font-semibold tracking-[0.08em] text-slate-400"
                >
                  {t.data.join("  ·  ")}
                </p>
              </li>
            ))}
          </RevealList>
        </section>

        {/* ── 02 방법론 + 규칙 ── */}
        <section className="pt-20 sm:pt-28">
          <SectionHead no="02" title="어떤 주제든 이 5단계" sub="데이터를 확보할 수 있는 주제인지 먼저 확인해 주세요" />
          <RevealList className="mt-10 grid gap-6 sm:grid-cols-5">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="relative sm:pr-4">
                <div className="flex items-center gap-3 sm:block">
                  <span
                    style={NUM_FONT}
                    className="text-3xl font-extrabold tracking-[-0.04em] text-accent-warm"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden
                    className="hidden h-px flex-1 bg-slate-200 sm:mt-3 sm:block"
                  />
                </div>
                <p className="mt-3 font-bold tracking-[-0.01em]">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p>
              </li>
            ))}
          </RevealList>
          <Reveal className="mt-12 rounded-3xl bg-[#1f3a93] px-6 py-6 text-white sm:px-8">
            <dl className="grid gap-5 sm:grid-cols-4">
              {RULES.map(([k, v]) => (
                <div key={k}>
                  <dt
                    style={NUM_FONT}
                    className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent-warm"
                  >
                    {k}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        <TeamTopicBoard />

        <p
          style={NUM_FONT}
          className="mt-24 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400"
        >
          바이브코딩 프로젝트 팀 · 공공 × 데이터 × AI
        </p>
      </div>
    </main>
  );
}
