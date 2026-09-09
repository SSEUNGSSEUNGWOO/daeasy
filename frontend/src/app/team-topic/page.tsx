import type { Metadata } from "next";

import { Reveal, RevealList } from "@/components/reveal";

import { TeamTopicBoard } from "./board";
import { NUM_FONT, TEAM_COUNT, TOPICS } from "./content";

// 교육생 배포용 임시 페이지 — 검색엔진 색인 제외
export const metadata: Metadata = {
  title: "팀 프로젝트 주제 제출",
  robots: { index: false, follow: false },
};

const STEPS = [
  ["주제·범위 선정", "한 팀 = 한 주제. 대상 부처·지자체·이슈를 좁힌다"],
  ["외부 데이터 확보", "공공데이터 API · 크롤링 · PDF 파싱 · 직접 수집"],
  ["AI 에이전트 분석", "MCP로 도구 호출, 비교·요약·이상탐지·교차검증"],
  ["시각화·인사이트", "지도·타임라인·네트워크·대시보드, 한 화면에서"],
  ["시연·문서화", "웹 프로토타입 + 데이터 소스 문서 + 5분 시연"],
] as const;

const RULES = [
  ["팀", "4명 1팀 · 기획·데이터·개발·시연 분담 자율"],
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
      {/* ── 히어로: 다크 + 광원 + 괘선 ── */}
      <section className="relative overflow-hidden bg-[#0b2a5b] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_88%_115%,rgba(249,115,22,0.55),transparent_60%),radial-gradient(800px_480px_at_-5%_-10%,rgba(59,130,246,0.55),transparent_60%),linear-gradient(180deg,#061a3d,#0b2a5b)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:100%_56px]"
        />
        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
          <p
            style={NUM_FONT}
            className="anim-hero-fade text-[11px] font-bold uppercase tracking-[0.28em] text-accent-warm"
          >
            CDSA · Vibe Coding Team Project
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-end">
            <div className="anim-page-fade-up">
              <h1 className="text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
                범정부 AI 서비스,
                <br />
                우리 조는
                <br />
                무엇을 만들까<span className="text-accent-warm">.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                외부 데이터를 수집·정제·분석해 국민·공무원·연구자에게 도움이 되는 범정부 AI
                서비스를 팀 단위로 기획·구현·시연합니다. 예시는 참고일 뿐, 주제는 자유입니다.
              </p>
            </div>
            <figure className="anim-cover-scale-fade relative rounded-3xl border border-white/20 bg-white/[0.08] p-7 backdrop-blur-xl sm:p-8">
              <span
                aria-hidden
                style={NUM_FONT}
                className="absolute -top-3 left-6 text-7xl font-extrabold leading-none text-accent-warm"
              >
                “
              </span>
              <figcaption
                style={NUM_FONT}
                className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60"
              >
                핵심 질문
              </figcaption>
              <blockquote className="mt-4 text-2xl font-bold leading-snug tracking-[-0.02em] sm:text-[1.7rem]">
                이 서비스는 누구의
                <br />
                어떤 문제를 푸는가?
              </blockquote>
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                한 문장으로 답할 수 있어야 합니다. 그 문장이 곧 제출 내용입니다.
              </p>
            </figure>
          </div>
          <dl className="anim-hero-fade mt-14 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
            {STATS.map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="flex items-baseline gap-2">
                  <span
                    style={NUM_FONT}
                    className="text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl"
                  >
                    {n}
                  </span>
                  <span className="text-sm text-white/60">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 pb-40 sm:px-8">
        {/* ── 01 예시 ── */}
        <section className="pt-20 sm:pt-28">
          <SectionHead no="01" title="주제 예시 10선" sub="그대로 골라도, 같은 프레임으로 새 주제를 잡아도 됩니다" />
          <RevealList className="mt-10 grid gap-x-10 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <li key={t.code} className="group relative border-t border-slate-200 py-6 pr-16">
                <span
                  aria-hidden
                  style={NUM_FONT}
                  className="absolute right-0 top-4 text-6xl font-extrabold leading-none tracking-[-0.06em] text-[#dbe4f0] transition-colors duration-300 group-hover:text-accent-warm"
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
          <SectionHead no="02" title="어떤 주제든 이 5단계" sub="데이터 확보가 프로젝트의 절반입니다" />
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
          <Reveal className="mt-12 rounded-3xl bg-[#0b2a5b] px-6 py-6 text-white sm:px-8">
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
          CDSA · Vibe Coding Project Team · Public × Data × AI
        </p>
      </div>
    </main>
  );
}
