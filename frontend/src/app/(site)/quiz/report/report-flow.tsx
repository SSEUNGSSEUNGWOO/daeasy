"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { CourseLevel } from "@/lib/courses";

export type ReportCourse = {
  slug: string;
  title: string;
  level: CourseLevel;
};

type Phase = "idle" | "streaming" | "done" | "error";
type Reco = { course: ReportCourse; reason: string };

const CHIPS = [
  "구청에서 민원 응대를 담당합니다",
  "보도자료·홍보 자료를 작성합니다",
  "보조금 정산과 통계 업무를 합니다",
  "사업 계획서·보고서를 씁니다",
];

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "심화",
};

const FALLBACK_MSG = "리포트 생성에 실패했어요. 잠시 후 다시 시도해주세요.";

class ReportError extends Error {}

/**
 * 예시 칩은 고정 문자열이라 매번 모델을 부를 이유가 없다.
 * 미리 생성해둔 응답 원문을 그대로 재생하면 타자기 연출은 동일하고
 * API 비용과 IP당 rate limit 을 쓰지 않는다.
 * 갱신: `node scripts/gen-canned.mjs` (프롬프트·과정 목록이 바뀌면 다시 생성)
 */
let cannedCache: Record<string, string> | null = null;
async function loadCanned(key: string): Promise<string | null> {
  if (!CHIPS.includes(key)) return null;
  try {
    cannedCache ??= await fetch("/experience/report-canned.json").then((r) =>
      r.ok ? (r.json() as Promise<Record<string, string>>) : null,
    );
  } catch {
    // 정적 파일을 못 받으면 그냥 모델을 부른다 (fail-open)
    return null;
  }
  return cannedCache?.[key] ?? null;
}

/** 스트리밍 중 json 블록을 화면에 노출하지 않기 위해 펜스 앞부분만 남긴다. */
const visibleText = (s: string) => s.split("```")[0]!.replace(/`{1,2}$/, "");

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
  const [work, setWork] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState("");
  const [recos, setRecos] = useState<Reco[]>([]);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

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

  useEffect(
    () => () => {
      abortRef.current?.abort();
      stopTyper();
    },
    [],
  );

  async function run() {
    const trimmed = work.trim();
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

    abortRef.current?.abort();

    const canned = await loadCanned(trimmed);
    if (canned) {
      targetRef.current = visibleText(canned).trim();
      setRecos(extractRecos(canned, courses));
      streamEndedRef.current = true;
      return;
    }

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/experience/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work: trimmed }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const detail = await res
          .json()
          .then((d: { detail?: string }) => d.detail)
          .catch(() => null);
        throw new ReportError(detail ?? FALLBACK_MSG);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        targetRef.current = visibleText(full);
      }
      full += decoder.decode();

      targetRef.current = visibleText(full).trim();
      setRecos(extractRecos(full, courses));
      // 타자기가 남은 버퍼를 다 풀어내면 스스로 done 으로 전환한다
      streamEndedRef.current = true;
    } catch (err) {
      if (ac.signal.aborted) return;
      stopTyper();
      // 받다 만 텍스트는 즉시 전부 보여주고 에러를 안내한다
      const target = targetRef.current;
      displayedLenRef.current = target.length;
      setReport(target);
      console.error("리포트 생성 실패:", err);
      setError(err instanceof ReportError ? err.message : FALLBACK_MSG);
      setPhase("error");
    }
  }

  function restart() {
    stopTyper();
    targetRef.current = "";
    displayedLenRef.current = 0;
    streamEndedRef.current = false;
    setWork("");
    setPhase("idle");
    setReport("");
    setRecos([]);
    setError("");
  }

  // ── 입력 화면 ──
  if (phase === "idle" || (phase === "error" && report === "")) {
    return (
      <div className="anim-page-fade-up mt-12">
        <textarea
          value={work}
          onChange={(e) => setWork(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="예) 구청에서 소상공인 보조금 정산을 담당합니다"
          aria-label="담당 업무 설명"
          className="w-full rounded-2xl bg-white p-5 text-[15.5px] leading-[1.7] text-ink ring-1 ring-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setWork(chip)}
              className="rounded-full border border-zinc-300 px-3.5 py-1.5 text-[13px] font-semibold text-zinc-600 transition hover:border-accent hover:text-accent"
            >
              {chip}
            </button>
          ))}
        </div>

        {phase === "error" && (
          <p className="mt-4 text-[14px] font-semibold text-red-600">{error}</p>
        )}

        <button
          type="button"
          onClick={run}
          disabled={!work.trim()}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-[15px] font-bold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          AI 리포트 받기 →
        </button>
        <p className="mt-3 text-[12.5px] text-zinc-400">
          개인정보(이름 · 연락처 등)는 적지 마세요 · 입력 내용은 저장되지 않습니다
        </p>
      </div>
    );
  }

  // ── 생성 중 + 결과 화면 ──
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
