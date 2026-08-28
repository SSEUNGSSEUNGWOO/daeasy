"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { CourseLevel } from "@/lib/courses";

export type ReportCourse = {
  slug: string;
  title: string;
  summary: string;
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

const JSON_FENCE = "```json";

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

  async function run() {
    const trimmed = work.trim();
    if (!trimmed || phase === "streaming") return;
    setPhase("streaming");
    setReport("");
    setRecos([]);
    setError("");

    try {
      const res = await fetch("/api/experience/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work: trimmed }),
      });
      if (!res.ok || !res.body) {
        const detail = await res
          .json()
          .then((d: { detail?: string }) => d.detail)
          .catch(() => null);
        throw new Error(
          detail ?? "리포트 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        // json 블록은 화면에 노출하지 않는다 (스트리밍 중에도)
        setReport(full.split(JSON_FENCE)[0]!);
      }
      full += decoder.decode();

      setReport(full.split(JSON_FENCE)[0]!.trim());
      setRecos(extractRecos(full, courses));
      setPhase("done");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "리포트 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
      setPhase("error");
    }
  }

  function restart() {
    setWork("");
    setPhase("idle");
    setReport("");
    setRecos([]);
    setError("");
  }

  // ── 입력 화면 ──
  if (phase === "idle" || phase === "error") {
    return (
      <div className="anim-page-fade-up mt-12">
        <textarea
          value={work}
          onChange={(e) => setWork(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="예) 구청에서 소상공인 보조금 정산을 담당합니다"
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
      <div className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
        <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          {phase === "streaming" ? "⚡ AI가 리포트를 쓰는 중..." : "리포트 완성"}
        </p>
        <div className="prose prose-zinc mt-4 max-w-none text-[15px] leading-[1.75]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
        </div>
      </div>

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

          <button
            type="button"
            onClick={restart}
            className="mt-8 text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
          >
            다시 해보기
          </button>
        </>
      )}
    </div>
  );
}
