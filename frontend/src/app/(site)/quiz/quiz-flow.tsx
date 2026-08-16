"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { CourseLevel } from "@/lib/courses";

export type QuizCourse = {
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
};

// ── 문항 정의 ────────────────────────────────────────────────
type Answers = {
  industry?: "finance" | "retail" | "general";
  role?: "lead" | "practical" | "tech";
  level?: CourseLevel;
  goal?: "literacy" | "automation" | "analysis" | "build";
};

const QUESTIONS = [
  {
    key: "industry" as const,
    title: "어떤 조직이신가요?",
    options: [
      { value: "finance", label: "금융", desc: "은행 · 보험 · 카드 · 증권" },
      { value: "retail", label: "유통 · 리테일", desc: "유통 · 커머스 · 소비재" },
      { value: "general", label: "공공 · 제조 · 기타", desc: "공공기관 · 제조 · 서비스 등" },
    ],
  },
  {
    key: "role" as const,
    title: "어떤 역할로 참여하시나요?",
    options: [
      { value: "lead", label: "의사결정 · 조직 리딩", desc: "경영진 · 팀장 · 관리자" },
      { value: "practical", label: "현업 실무", desc: "기획 · 운영 · 마케팅 등 비개발 직군" },
      { value: "tech", label: "데이터 · 개발 담당", desc: "분석가 · 개발자 · IT 부서" },
    ],
  },
  {
    key: "level" as const,
    title: "AI · 데이터, 지금 어디쯤인가요?",
    options: [
      { value: "beginner", label: "이제 시작", desc: "개념부터 잡고 싶다" },
      { value: "intermediate", label: "기본기는 있다", desc: "업무에 붙이고 싶다" },
      { value: "advanced", label: "이미 쓰고 있다", desc: "심화 · 전문화가 필요하다" },
    ],
  },
  {
    key: "goal" as const,
    title: "가장 이루고 싶은 것은?",
    options: [
      { value: "literacy", label: "전 직원 공통 리터러시", desc: "조직 전체의 기본기" },
      { value: "automation", label: "반복 업무 자동화 · 생산성", desc: "생성형 AI 를 일에 붙이기" },
      { value: "analysis", label: "데이터 분석 · 리포팅", desc: "분석 · 시각화 · 데이터 기반 보고" },
      { value: "build", label: "AI 서비스 · 모델 개발", desc: "LLM · 머신러닝으로 직접 만들기" },
    ],
  },
];

// ── 채점 ────────────────────────────────────────────────────
const LEVEL_ORDER: Record<CourseLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

const ROLE_RE: Record<NonNullable<Answers["role"]>, RegExp> = {
  lead: /리더십|의사결정|경영|관리자/,
  practical: /활용|업무|생산성|리터러시|기획/,
  tech: /python|파이썬|SQL|머신러닝|딥러닝|LLM|개발|텐서플로|트랜스포머|모델|분석/i,
};

const GOAL_RE: Record<NonNullable<Answers["goal"]>, RegExp> = {
  literacy: /리터러시/,
  automation: /생성형|자동화|생산성|업무 효율|챗GPT|ChatGPT|노코드/i,
  analysis: /분석|시각화|엑셀|SQL|EDA|빅데이터|데이터 기반/i,
  build: /LLM|서비스|MVP|머신러닝|딥러닝|텐서플로|트랜스포머|해커톤/i,
};

const TRACK_RE: Record<NonNullable<Answers["industry"]>, RegExp> = {
  finance: /^\[금융 특화\]/,
  retail: /^\[유통 특화\]/,
  general: /^\[표준 과정\]/,
};

function scoreCourse(c: QuizCourse, a: Required<Answers>): number {
  let score = 0;
  const text = `${c.title} ${c.summary}`;

  if (TRACK_RE[a.industry].test(c.title)) score += 3;
  if (/^\[표준 과정\]/.test(c.title)) score += 1; // 표준 과정은 누구에게나 후보

  const diff = Math.abs(LEVEL_ORDER[c.level] - LEVEL_ORDER[a.level]);
  if (diff === 0) score += 2;
  else if (diff === 1) score += 1;

  if (ROLE_RE[a.role].test(text)) score += 2;
  if (GOAL_RE[a.goal].test(text)) score += 3;

  return score;
}

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "심화",
};

const TRACK_PATTERN = /^\[([^\]]+)\]\s*/;

function splitTrack(title: string): { track: string; clean: string } {
  const m = title.match(TRACK_PATTERN);
  if (!m) return { track: "공개 과정", clean: title };
  return { track: m[1]!, clean: title.slice(m[0].length) };
}

// ── 컴포넌트 ────────────────────────────────────────────────
export function QuizFlow({ courses }: { courses: QuizCourse[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const done = step >= QUESTIONS.length;

  const results = useMemo(() => {
    if (!done) return [];
    const a = answers as Required<Answers>;
    return [...courses]
      .map((c) => ({ course: c, score: scoreCourse(c, a) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, 3);
  }, [done, answers, courses]);

  function answer(key: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStep((s) => s + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  if (done) {
    return (
      <div className="anim-page-fade-up mt-12">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">추천 결과</p>
        <h2 className="mt-3 text-[26px] font-extrabold leading-[1.2] tracking-[-0.015em] text-ink sm:text-[32px]">
          이 과정부터 보시면 됩니다.
        </h2>
        <p className="mt-3 text-[15px] text-zinc-600">
          답해주신 조직 · 역할 · 수준 · 목표 기준 상위 3개 과정입니다. 모든 과정은 사전 인터뷰 후 조직에 맞게 재설계됩니다.
        </p>

        <ul className="mt-8 space-y-4">
          {results.map(({ course }, i) => {
            const { track, clean } = splitTrack(course.title);
            return (
              <li key={course.slug} className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-zinc-400">0{i + 1}</span>
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                    {track}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
                    {LEVEL_LABEL[course.level]}
                  </span>
                </div>
                <h3 className="mt-3 text-[19px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                  {clean}
                </h3>
                <p className="mt-2 line-clamp-2 text-[14px] leading-[1.65] text-zinc-600">
                  {course.summary}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/contact?course=${encodeURIComponent(course.slug)}`}
                    className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-accent/90"
                  >
                    이 과정으로 문의하기
                  </Link>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-5 py-2.5 text-[14px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    과정 자세히 보기
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={restart}
          className="mt-8 text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
        >
          처음부터 다시 하기
        </button>
      </div>
    );
  }

  const q = QUESTIONS[step]!;

  return (
    <div className="mt-12">
      {/* 진행 표시 */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-zinc-200"}`}
            />
          ))}
        </div>
        <span className="text-[12.5px] font-semibold text-zinc-500">
          {step + 1} / {QUESTIONS.length}
        </span>
      </div>

      <div key={q.key} className="anim-page-fade-up mt-8">
        <h2 className="text-[24px] font-extrabold leading-[1.25] tracking-[-0.015em] text-ink sm:text-[30px]">
          {q.title}
        </h2>
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {q.options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => answer(q.key, o.value)}
              className="rounded-2xl bg-white p-6 text-left ring-1 ring-zinc-200 transition hover:-translate-y-[2px] hover:ring-accent hover:shadow-[0_8px_24px_-12px_rgba(37,99,235,0.35)]"
            >
              <span className="block text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                {o.label}
              </span>
              <span className="mt-1 block text-[13.5px] text-zinc-500">{o.desc}</span>
            </button>
          ))}
        </div>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mt-6 text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
          >
            ← 이전 질문으로
          </button>
        )}
      </div>
    </div>
  );
}
