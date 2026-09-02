"use client";

import { useState } from "react";

/* 세 등급 모두 활성 시 등급색 다크 패널로 반전 — 안쪽 텍스트는 흰색 계열.
   emerald·blue 는 흰 텍스트 대비(WCAG)를 위해 700 단계를 쓴다. */
const TRACKS = [
  {
    name: "Green",
    level: "초급",
    role: "실무 기획자",
    title: "아이디어를 정책과 서비스로 구체화합니다.",
    body: "생성형 AI와 노코드 도구를 활용해 행정 혁신 아이디어를 기획안과 업무 프로토타입으로 구현합니다.",
    audience: "비개발 실무자",
    dot: "bg-emerald-500",
    shellActive: "bg-emerald-700 ring-emerald-700",
    badgeActive: "bg-white/15 text-white",
  },
  {
    name: "Blue",
    level: "중급",
    role: "AI 전환 실행자",
    title: "PoC부터 구축까지 실행을 주도합니다.",
    body: "데이터 분석과 모델링, LLM API·RAG·FastAPI를 활용해 기관 맞춤형 AI 서비스를 설계하고 구현합니다.",
    audience: "IT 담당자·개발 인력",
    dot: "bg-blue-600",
    shellActive: "bg-blue-700 ring-blue-700",
    badgeActive: "bg-white/15 text-white",
  },
  {
    name: "Black",
    level: "고급",
    role: "AI 거점 리더",
    title: "기관의 AI 전환과 확산을 이끕니다.",
    body: "고급 AI 기술과 도구 생태계를 바탕으로 기관 단위 전환을 리딩하고 동료 코칭과 우수사례 확산을 주도합니다.",
    audience: "기관의 AI 전환을 이끄는 리더급 인재",
    dot: "bg-zinc-900",
    shellActive: "bg-ink-warm ring-ink-warm",
    badgeActive: "bg-white/15 text-white",
  },
] as const;

export function TrackPanels() {
  const [active, setActive] = useState(1);

  return (
    <div className="mt-12 flex flex-col gap-3 lg:flex-row">
      {TRACKS.map((track, index) => {
        const isActive = index === active;
        const inverted = isActive; // 활성 패널은 등급색으로 반전
        return (
          <article
            key={track.name}
            className={`overflow-hidden rounded-2xl ring-1 transition-all duration-500 ease-out motion-reduce:transition-none lg:min-w-0 lg:basis-0 ${
              isActive ? "lg:grow-[2]" : "lg:grow"
            } ${
              isActive ? track.shellActive : "bg-white ring-zinc-200 hover:ring-zinc-300"
            } ${inverted ? "text-white" : "text-ink"}`}
            onMouseEnter={() => setActive(index)}
          >
            <button
              type="button"
              aria-expanded={isActive}
              onClick={() => setActive(index)}
              onFocus={() => setActive(index)}
              className="w-full p-7 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-8"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/ai-champion/emblem-${track.name.toLowerCase()}.webp`}
                alt=""
                width={320}
                height={320}
                className="mb-6 h-20 w-20 rounded-2xl ring-1 ring-black/5"
              />
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2.5 text-[26px] font-extrabold tracking-[-0.02em]">
                  <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${inverted ? "bg-white ring-1 ring-white/40" : track.dot}`} />
                  {track.name}
                </p>
                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors duration-500 motion-reduce:transition-none ${
                    isActive ? track.badgeActive : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {track.level}
                </span>
              </div>
              <p className={`mt-6 text-[12px] font-bold uppercase tracking-[0.15em] ${inverted ? "text-white/65" : "text-zinc-500"}`}>
                {track.role}
              </p>
              <h3 className="mt-2 text-[20px] font-bold leading-[1.35] tracking-[-0.015em]">{track.title}</h3>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none ${
                isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`px-7 pb-7 transition-opacity duration-300 motion-reduce:transition-none sm:px-8 sm:pb-8 ${
                    isActive ? "opacity-100 delay-150" : "opacity-0"
                  }`}
                >
                  <p className={`text-[14.5px] leading-[1.75] ${inverted ? "text-white/85" : "text-zinc-600"}`}>{track.body}</p>
                  <div className={`mt-6 border-t pt-5 ${inverted ? "border-white/15" : "border-zinc-200/70"}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${inverted ? "text-white/65" : "text-zinc-500"}`}>대상</p>
                    <p className={`mt-1.5 text-[14px] font-semibold ${inverted ? "text-white/90" : "text-zinc-700"}`}>{track.audience}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
