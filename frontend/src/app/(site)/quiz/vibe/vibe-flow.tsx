"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { CourseLevel } from "@/lib/courses";

export type VibeCourse = {
  slug: string;
  title: string;
  level: CourseLevel;
};

type Phase = "idle" | "streaming" | "done" | "error";
type Reco = { course: VibeCourse; reason: string };

const CHIPS = [
  "부서 비품 신청 페이지",
  "회의실 예약 현황판",
  "민원 접수 폼",
  "팀 점심 메뉴 룰렛",
];

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "심화",
};

const FALLBACK_MSG = "코드 생성에 실패했어요. 잠시 후 다시 시도해주세요.";

class VibeError extends Error {}

const CSP_META =
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:;">';

const HEAD_RE = /<head(?=[\s>])(?:[^>"']|"[^"]*"|'[^']*')*>/i;
const HTML_RE = /<html(?=[\s>])(?:[^>"']|"[^"]*"|'[^']*')*>/i;
const DOCTYPE_RE = /^\s*<!doctype[^>]*>/i;

/** 생성된 HTML 에 외부 네트워크 차단 CSP 를 주입한다 (프롬프트 규칙과 이중 방어). */
function injectCsp(html: string): string {
  if (HEAD_RE.test(html)) {
    return html.replace(HEAD_RE, (m) => `${m}\n${CSP_META}`);
  }
  if (HTML_RE.test(html)) {
    return html.replace(HTML_RE, (m) => `${m}\n<head>${CSP_META}</head>`);
  }
  if (DOCTYPE_RE.test(html)) {
    return html.replace(DOCTYPE_RE, (m) => `${m}\n<head>${CSP_META}</head>`);
  }
  return `${CSP_META}\n${html}`;
}

/** 스트리밍 중 코드 패널 표시용: html 펜스 내부만 (도착 전이면 원문), 닫는 펜스·json 이후 숨김 */
function visibleStream(s: string): string {
  const open = s.match(/```html/i);
  let out = open
    ? s.slice(s.indexOf(open[0]) + open[0].length).replace(/^\n/, "")
    : s;
  const close = out.indexOf("```");
  if (close >= 0) out = out.slice(0, close);
  return out.replace(/`{1,2}$/, "");
}

/** 완료 후 html 펜스 내부 추출. 없으면 null (거절 응답 또는 잘림). */
function extractHtml(full: string): string | null {
  const m = full.match(/```html\s*([\s\S]*?)```/i);
  return m ? m[1]!.trim() : null;
}

/** html 펜스 이후 구간에서 json 추천을 파싱해 1개만 반환. 실패 시 빈 배열. */
function extractRecos(full: string, courses: VibeCourse[]): Reco[] {
  const htmlMatch = full.match(/```html\s*[\s\S]*?```/i);
  const rest = htmlMatch
    ? full.slice(full.indexOf(htmlMatch[0]) + htmlMatch[0].length)
    : full;
  const m = rest.match(/```json\s*([\s\S]*?)```/);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[1]!) as unknown;
    if (typeof parsed !== "object" || parsed === null) return [];
    const list = (parsed as { courses?: unknown }).courses;
    if (!Array.isArray(list)) return [];
    for (const item of list.slice(0, 1)) {
      if (typeof item !== "object" || item === null) continue;
      const { slug, reason } = item as { slug?: unknown; reason?: unknown };
      const course = courses.find((c) => c.slug === slug);
      if (course) {
        return [{ course, reason: typeof reason === "string" ? reason : "" }];
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function VibeFlow({ courses }: { courses: VibeCourse[] }) {
  const [work, setWork] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [recos, setRecos] = useState<Reco[]>([]);
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const stickRef = useRef(true);

  // 타자기: 도착한 코드를 버퍼에 두고 일정 속도로 풀어낸다 (코드용 고속).
  // 마지막 json 추천 블록 생성 구간(화면에 보여줄 게 없는 시간)도 버퍼가 덮는다.
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
      const backlog = target.length - cur;
      const next = Math.min(
        target.length,
        cur + (backlog > 300 ? 16 : backlog > 100 ? 8 : 4),
      );
      displayedLenRef.current = next;
      setCode(target.slice(0, next));
    }, 30);
  }

  useEffect(
    () => () => {
      abortRef.current?.abort();
      stopTyper();
    },
    [],
  );

  useEffect(() => {
    if (phase !== "streaming") return;
    const el = preRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [code, phase]);

  async function run() {
    const trimmed = work.trim();
    if (!trimmed || phase === "streaming") return;
    setPhase("streaming");
    setCode("");
    setSrcDoc(null);
    setRecos([]);
    setError("");
    setShowCode(false);
    stopTyper();
    targetRef.current = "";
    displayedLenRef.current = 0;
    streamEndedRef.current = false;
    stickRef.current = true;
    startTyper();

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/experience/vibe", {
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
        throw new VibeError(detail ?? FALLBACK_MSG);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        targetRef.current = visibleStream(full);
      }
      full += decoder.decode();

      targetRef.current = visibleStream(full).trim();
      const html =
        extractHtml(full) ??
        (/^\s*(<!doctype html|<html)/i.test(full)
          ? full.replace(/```[\s\S]*$/, "").trim()
          : null);
      setSrcDoc(html ? injectCsp(html) : null);
      setRecos(extractRecos(full, courses));
      // 타자기가 남은 버퍼를 다 풀어내면 스스로 done 으로 전환한다
      streamEndedRef.current = true;
    } catch (err) {
      if (ac.signal.aborted) return;
      stopTyper();
      const target = targetRef.current;
      displayedLenRef.current = target.length;
      setCode(target);
      console.error("코드 생성 실패:", err);
      setError(err instanceof VibeError ? err.message : FALLBACK_MSG);
      setPhase("error");
    }
  }

  function restart() {
    stopTyper();
    targetRef.current = "";
    displayedLenRef.current = 0;
    streamEndedRef.current = false;
    stickRef.current = true;
    setWork("");
    setPhase("idle");
    setCode("");
    setSrcDoc(null);
    setRecos([]);
    setError("");
    setShowCode(false);
  }

  // ── 입력 화면 ──
  if (phase === "idle" || (phase === "error" && code === "")) {
    return (
      <div className="anim-page-fade-up mt-12">
        <textarea
          value={work}
          onChange={(e) => setWork(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="예) 부서 비품 신청 페이지"
          aria-label="만들고 싶은 것 설명"
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
          코딩 시작 →
        </button>
        <p className="mt-3 text-[12.5px] text-zinc-400">
          개인정보(이름 · 연락처 등)는 적지 마세요 · 입력 내용은 저장되지 않습니다
        </p>
      </div>
    );
  }

  const empty =
    phase === "done" && srcDoc === null && code.trim() === "";
  const truncated =
    phase === "done" &&
    srcDoc === null &&
    !empty &&
    (code.includes("<") || code.length > 300);

  const showPanel = phase === "streaming" || phase === "error" || showCode || truncated;

  // ── 코드 극장 + 완성 화면 ──
  return (
    <div className="anim-page-fade-up mt-12">
      <p role="status" className="sr-only">
        {phase === "streaming"
          ? "AI가 코드를 쓰는 중입니다"
          : phase === "error"
            ? "코드 생성이 중단됐습니다"
            : srcDoc
              ? "웹앱이 완성됐습니다"
              : truncated || empty
                ? "생성이 완료되지 않았습니다"
                : "AI 응답이 도착했습니다"}
      </p>
      {showPanel && (
        <div
          className="rounded-2xl bg-zinc-900 p-6 ring-1 ring-zinc-800"
          aria-busy={phase === "streaming"}
        >
          <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            {phase === "streaming"
              ? "⚡ AI가 코드를 쓰는 중..."
              : phase === "error"
                ? "코드 생성이 중단됐어요"
                : truncated
                  ? "생성이 중간에 끊겼어요"
                  : "완성된 코드"}
          </p>
          <pre
            ref={preRef}
            tabIndex={0}
            role="group"
            aria-label="생성된 코드"
            onScroll={(e) => {
              const el = e.currentTarget;
              stickRef.current =
                el.scrollHeight - el.scrollTop - el.clientHeight < 48;
            }}
            className="mt-4 max-h-[420px] overflow-y-auto whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.6] text-emerald-300"
          >
            {phase === "streaming" ? `${code}▊` : code}
          </pre>
        </div>
      )}

      {phase === "error" && (
        <p className="mt-4 text-[14px] font-semibold text-red-600">{error}</p>
      )}

      {phase === "done" && (
        <>
          {srcDoc ? (
            <div className={showPanel ? "mt-6" : ""}>
              <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-accent">
                🎉 완성 — 실제로 동작하는 화면입니다
              </p>
              <iframe
                sandbox="allow-scripts"
                srcDoc={srcDoc}
                title="AI가 생성한 웹앱 미리보기"
                className="mt-4 h-[480px] w-full rounded-2xl bg-white ring-1 ring-zinc-200"
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                className="mt-4 text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
              >
                {showCode ? "코드 접기" : "코드 다시 보기"}
              </button>
            </div>
          ) : truncated || empty ? (
            <p className="mt-4 text-[14px] font-semibold text-red-600">
              앱을 완성하지 못했어요. 다시 만들기를 눌러 한 번 더 시도해주세요.
            </p>
          ) : (
            <div className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
              <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                AI 응답
              </p>
              <p className="mt-3 text-[15px] leading-[1.75] text-zinc-700">{code}</p>
            </div>
          )}

          {srcDoc &&
            (recos.length > 0 ? (
              <div className="mt-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
                  이런 걸 직접 만들려면
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
            ))}
        </>
      )}

      {(phase === "done" || phase === "error") && (
        <button
          type="button"
          onClick={restart}
          className="mt-8 block text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
        >
          다시 만들기
        </button>
      )}
    </div>
  );
}
