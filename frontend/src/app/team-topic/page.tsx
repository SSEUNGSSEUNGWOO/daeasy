import type { Metadata } from "next";

import { TeamTopicBoard } from "./board";
import { TOPICS } from "./content";

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
  "4명 1팀 · 기획·데이터·개발·시연 역할 분담 자율",
  "외부 데이터 중심 — 공공데이터 API · 크롤링 · PDF 파싱",
  "바이브코딩 · 에이전트 · MCP · 컨텍스트 활용",
  "산출물: 웹 프로토타입 + 데이터 소스 문서 + 팀별 시연 5분",
] as const;

export default function TeamTopicPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-ink">
      <div className="mx-auto max-w-4xl px-5 pb-40 pt-16 sm:px-8 sm:pt-24">
        {/* 헤더 */}
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            CDSA 바이브코딩 팀 프로젝트
          </p>
          <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
            범정부 AI 서비스,
            <br />
            우리 조는 무엇을 만들까
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600">
            외부 데이터를 수집·정제·분석해 국민·공무원·연구자에게 도움이 되는 범정부 AI
            서비스를 팀 단위로 기획·구현·시연합니다. 아래 예시는 참고일 뿐, 주제는 자유입니다.
          </p>
          <div className="mt-8 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              핵심 질문
            </p>
            <p className="mt-2 text-xl font-bold leading-snug tracking-[-0.01em] sm:text-2xl">
              “이 서비스는 누구의 어떤 문제를 푸는가?”
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              한 문장으로 답할 수 있어야 합니다. 그 문장이 곧 제출 내용입니다.
            </p>
          </div>
        </header>

        {/* 예시 */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">주제 예시 10선</h2>
          <p className="mt-1 text-sm text-neutral-500">
            그대로 골라도, 같은 프레임으로 새 주제를 잡아도 됩니다.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <li
                key={t.code}
                className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">
                    {t.code}
                  </span>
                  <span aria-hidden className="text-lg leading-none">
                    {t.icon}
                  </span>
                  <h3 className="text-base font-bold tracking-[-0.01em]">{t.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t.q}</p>
                <p className="mt-2 text-xs tracking-[0.01em] text-neutral-400">
                  {t.data.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* 방법론 + 규칙 */}
        <section className="mt-20 grid gap-10 sm:grid-cols-[3fr_2fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em]">어떤 주제든 이 5단계</h2>
            <ol className="mt-6 space-y-4">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-sm text-neutral-500">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em]">공통 규칙</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-neutral-600">
              {RULES.map((r) => (
                <li key={r} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <TeamTopicBoard />
      </div>
    </main>
  );
}
