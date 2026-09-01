"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { CourseLevel } from "@/lib/courses";

import { REPORT_PRESETS } from "../presets";

export type ReportCourse = {
  slug: string;
  title: string;
  level: CourseLevel;
};

type Phase = "idle" | "streaming" | "done" | "error";
type Reco = { course: ReportCourse; reason: string };


const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "심화",
};

const FALLBACK_MSG = "리포트를 불러오지 못했어요. 잠시 후 다시 시도해주세요.";

/**
 * 선택지는 고정돼 있으므로 응답을 미리 생성해 두고 그대로 재생한다.
 * 타자기 연출은 동일하고 API 비용과 rate limit 을 쓰지 않는다.
 * 갱신: `node scripts/gen-canned.mjs` — 생성 후 JSON 을 직접 다듬어도 된다.
 */
let cannedCache: Record<string, string> | null = null;
async function loadCanned(key: string): Promise<string | null> {
  try {
    cannedCache ??= await fetch("/experience/report-canned.json").then((r) =>
      r.ok ? (r.json() as Promise<Record<string, string>>) : null,
    );
  } catch {
    // 정적 파일을 못 받으면 모델을 부른다 (fail-open)
    return null;
  }
  return cannedCache?.[key] ?? null;
}

/** 스트리밍 중 json 블록을 화면에 노출하지 않기 위해 펜스 앞부분만 남긴다. */
const visibleText = (s: string) => s.split("```")[0]!.replace(/`{1,2}$/, "");

/**
 * 리포트 본문에 흩어진 "(예상 절감: 주당 약 N시간)" 을 합산한다.
 * 항목별로 3~5시간씩 적혀 있어도 읽는 사람은 총합을 계산하지 않는다.
 * 합계를 크게 보여주는 것이 이 체험의 설득력 대부분을 만든다.
 */
function totalWeeklyHours(md: string): number {
  return [...md.matchAll(/주당\s*약?\s*(\d+(?:\.\d+)?)\s*시간/g)].reduce(
    (sum, m) => sum + Number(m[1]),
    0,
  );
}

/** 주당 시간 → 연간 환산. 연 48주 근무(휴가·공휴일 제외) 기준의 보수적 추정 */
const WORK_WEEKS = 48;

/** 응답 끝의 ```json {"courses":[...]}``` 블록을 파싱해 추천 카드 데이터로 변환. 실패 시 빈 배열. */
function extractRecos(full: string, courses: ReportCourse[]): Reco[] {
  const m = full.match(/```json\s*([\s\S]*?)```/);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[1]!) as unknown;
    if (typeof parsed !== "object" || parsed === null) return [];
    const list = (parsed as { courses?: unknown }).courses;
    if (!Array.isArray(list)) return [];
    const recos: Reco[] = [];
    for (const item of list.slice(0, 2)) {
      if (typeof item !== "object" || item === null) continue;
      const { slug, reason } = item as { slug?: unknown; reason?: unknown };
      const course = courses.find((c) => c.slug === slug);
      if (course) {
        if (recos.some((r) => r.course.slug === course.slug)) continue;
        recos.push({ course, reason: typeof reason === "string" ? reason : "" });
      }
    }
    return recos;
  } catch {
    return [];
  }
}

export function ReportFlow({ courses }: { courses: ReportCourse[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState("");
  const [recos, setRecos] = useState<Reco[]>([]);
  const [error, setError] = useState("");

  // 타자기 연출: 네트워크로 도착한 전체 텍스트(target)를 버퍼에 두고
  // 일정한 속도로 풀어낸다. 덩어리 도착이 부드러운 타이핑으로 보이고,
  // 마지막 json 블록 생성 구간(화면에 보여줄 게 없는 시간)도 버퍼가 덮는다.
  const targetRef = useRef("");
  const displayedLenRef = useRef(0);
  const streamEndedRef = useRef(false);
  const typerRef = useRef<number | null>(null);

  function stopTyper() {
    if (typerRef.current !== null) {
      window.clearInterval(typerRef.current);
      typerRef.current = null;
    }
  }

  function startTyper() {
    if (typerRef.current !== null) return;
    typerRef.current = window.setInterval(() => {
      const target = targetRef.current;
      const cur = displayedLenRef.current;
      if (cur >= target.length) {
        if (streamEndedRef.current) {
          stopTyper();
          setPhase("done");
        }
        return;
      }
      // 밀린 분량이 많을수록 빨리 따라잡아 스트림 종료 후 오래 끌지 않는다
      const backlog = target.length - cur;
      const next = Math.min(
        target.length,
        cur + (backlog > 150 ? 8 : backlog > 60 ? 4 : 2),
      );
      displayedLenRef.current = next;
      setReport(target.slice(0, next));
    }, 30);
  }

  useEffect(() => stopTyper, []);

  async function run(selected: string) {
    const trimmed = selected.trim();
    if (!trimmed || phase === "streaming") return;
    setPhase("streaming");
    setReport("");
    setRecos([]);
    setError("");
    stopTyper();
    targetRef.current = "";
    displayedLenRef.current = 0;
    streamEndedRef.current = false;
    startTyper();

    const canned = await loadCanned(trimmed);
    if (!canned) {
      stopTyper();
      console.error("리포트 원문을 불러오지 못했습니다:", trimmed);
      setError(FALLBACK_MSG);
      setPhase("error");
      return;
    }

    targetRef.current = visibleText(canned).trim();
    setRecos(extractRecos(canned, courses));
    // 타자기가 남은 버퍼를 다 풀어내면 스스로 done 으로 전환한다
    streamEndedRef.current = true;
  }

  function restart() {
    stopTyper();
    targetRef.current = "";
    displayedLenRef.current = 0;
    streamEndedRef.current = false;
    setPhase("idle");
    setReport("");
    setRecos([]);
    setError("");
  }

  // ── 선택 화면 ──
  if (phase === "idle" || (phase === "error" && report === "")) {
    return (
      <div className="anim-page-fade-up mt-12">
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          담당 업무를 골라주세요
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {REPORT_PRESETS.map((preset) => (
            <button
              key={preset.work}
              type="button"
              onClick={() => run(preset.work)}
              className="group rounded-xl bg-white p-5 text-left ring-1 ring-zinc-200 transition hover:ring-2 hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-accent">
                {preset.category}
              </span>
              <span className="mt-1.5 block text-[15px] font-semibold leading-[1.5] text-ink">
                {preset.work}
              </span>
            </button>
          ))}
        </div>

        {phase === "error" && (
          <p className="mt-5 text-[14px] font-semibold text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // ── 생성 중 + 결과 화면 ──
  const savedHours = totalWeeklyHours(report);

  return (
    <div className="anim-page-fade-up mt-12">
      <div
        className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100"
        aria-busy={phase === "streaming"}
      >
        <p
          role="status"
          className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-zinc-400"
        >
          {phase === "streaming"
            ? "⚡ AI가 리포트를 쓰는 중..."
            : phase === "error"
              ? "리포트 생성이 중단됐어요"
              : "리포트 완성"}
        </p>
        <div className="prose prose-zinc mt-4 max-w-none text-[15px] leading-[1.75]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {phase === "streaming" ? `${report}▊` : report}
          </ReactMarkdown>
        </div>
      </div>

      {/* 본문에 흩어진 절감 시간을 합쳐 한 번에 보여준다 — 이 체험의 결론에 해당한다 */}
      {phase === "done" && savedHours > 0 && (
        <div className="anim-page-fade-up mt-6 overflow-hidden rounded-2xl bg-ink text-white">
          <div className="px-7 py-6">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-white/50">
              AI로 되찾는 시간
            </p>
            <p className="mt-3 text-[15px] text-white/70">
              위 3가지만 적용해도
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[44px] font-extrabold leading-none tracking-[-0.03em]">
                주당 {savedHours}시간
              </span>
              <span className="text-[17px] font-semibold text-white/70">
                을 아낍니다
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-5">
              <div>
                <p className="text-[12px] text-white/50">연간 환산</p>
                <p className="mt-0.5 text-[19px] font-bold">
                  {(savedHours * WORK_WEEKS).toLocaleString()}시간
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50">근무일로 치면</p>
                <p className="mt-0.5 text-[19px] font-bold">
                  약 {Math.round((savedHours * WORK_WEEKS) / 8)}일
                </p>
              </div>
            </div>
            <p className="mt-4 text-[12px] leading-[1.6] text-white/40">
              리포트에 적힌 항목별 예상 절감 시간을 합산한 값입니다 · 연 {WORK_WEEKS}주
              근무 기준
            </p>
          </div>
        </div>
      )}

      {phase === "error" && (
        <p className="mt-4 text-[14px] font-semibold text-red-600">{error}</p>
      )}

      {phase === "done" && (
        <>
          {recos.length > 0 ? (
            <div className="mt-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
                이 업무에 맞는 교육
              </p>
              <ul className="mt-4 space-y-4">
                {recos.map(({ course, reason }) => (
                  <li
                    key={course.slug}
                    className="rounded-2xl bg-white p-7 ring-1 ring-accent/30"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
                        {LEVEL_LABEL[course.level]}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[19px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                      {course.title}
                    </h3>
                    {reason && (
                      <p className="mt-2 text-[14px] leading-[1.65] text-zinc-600">
                        AI가 고른 이유: {reason}
                      </p>
                    )}
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
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-8">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-5 py-2.5 text-[14px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                전체 교육과정 보기
              </Link>
            </div>
          )}
        </>
      )}

      {(phase === "done" || phase === "error") && (
        <button
          type="button"
          onClick={restart}
          className="mt-8 text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
        >
          다시 해보기
        </button>
      )}
    </div>
  );
}
