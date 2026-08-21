"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "./gsap-setup";

/**
 * 운영 범위 4단계. /ai-champion 의 operationScopes 와 같은 내용이다.
 * 여기가 경쟁사와 갈리는 지점이라 실적 숫자보다 앞에 세운다 —
 * 교육만 하는 곳은 많아도 진단 체계를 설계하고 인증까지 운영하는 곳은 드물다.
 */
const OPERATION_STEPS = [
  { title: "역량체계 설계", body: "역량진단 모델·평가 지표 개발" },
  { title: "교육 운영", body: "학습·과제 지원" },
  { title: "인증평가", body: "CBT·본인확인·화상 감독" },
  { title: "결과 관리", body: "채점·심사, 통계 운영" },
] as const;

export function SceneAiChampion() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 타깃을 클래스로 명시한다. 레이아웃이 2단 그리드라 직계 자식만 잡으면
      // 카피 뭉치와 실적 패널이 통째로 하나씩 떠서 리듬이 사라진다.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".ai-champion-reveal",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.07,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 78%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    /* 히어로(밝음) 바로 다음이라 어두운 면으로 받는다. 같은 톤이 이어지면
       가장 강한 실적이 배경에 묻힌다. 색·글로우는 /ai-champion 히어로와 같다. */
    <section ref={scope} className="relative isolate overflow-hidden bg-ink-warm text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(37,99,235,0.26),transparent_44%)]"
      />

      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
          <div>
            <p className="ai-champion-reveal text-[13px] font-bold uppercase tracking-[0.18em] text-blue-300">
              국가 AI 인재 인증
            </p>
            <h2 className="ai-champion-reveal mt-3 text-[36px] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-[48px] lg:text-[54px]">
              행정안전부 AI 챔피언<br />역량진단부터 인증까지 운영합니다.
            </h2>
            <p className="ai-champion-reveal mt-6 max-w-xl text-[16px] leading-[1.8] text-zinc-300 sm:text-[17px]">
              역량진단 모델과 평가 지표를 직접 개발했고, 종합과정과 인증평가를 공식 대행해
              운영하고 있습니다.
            </p>
            <Link
              href="/ai-champion"
              className="ai-champion-reveal group mt-8 inline-flex items-center gap-2 text-[15px] font-bold text-white"
            >
              AI 챔피언 자세히 보기
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* 실적은 카드 세 장이 아니라 패널 하나로 묶는다. 세 장으로 늘어놓으면
              아래 4단 파이프라인과 같은 박스가 일곱 개 깔려 화면이 뭉갠다.
              핵심 지표(인증) 하나만 크게 세우고 나머지는 목록으로 내린다. */}
          <div className="ai-champion-reveal rounded-3xl bg-white/[0.06] p-8 ring-1 ring-white/10 backdrop-blur-sm sm:p-9">
            <p className="text-[13px] font-bold text-blue-300">AI 챔피언 인증</p>
            <p className="mt-2 text-[52px] font-extrabold leading-none tracking-[-0.035em] sm:text-[60px]">
              1,450
              <span className="ml-1.5 text-[22px] font-bold text-zinc-400">명</span>
            </p>
            <p className="mt-2.5 text-[12px] text-zinc-400">2025 ~ 2026년 8월 누적</p>

            <dl className="mt-7 space-y-3.5 border-t border-white/10 pt-7 text-[14px]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-zinc-400">교육 수료</dt>
                <dd className="font-bold tracking-[-0.01em]">2,227명</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-zinc-400">표준 콘텐츠 개발</dt>
                <dd className="font-bold tracking-[-0.01em]">12종</dd>
              </div>
            </dl>

            {/* 예측은 확정 실적과 다른 그릇에 담는다. 같은 목록에 섞으면
                담당자가 품의서에 옮길 숫자까지 추정치로 읽힌다. */}
            <p className="mt-7 rounded-full bg-blue-400/10 px-4 py-2.5 text-center text-[12.5px] font-semibold text-blue-300 ring-1 ring-blue-400/20">
              2026년 연간 2,200명 이상 인증 예정
            </p>
          </div>
        </div>

        {/* 연결선은 lg 에서만 그린다. 아래 구간은 4열이 2열·1열로 접혀 가로 흐름이
            끊기는데, 그 자리에 선이 남으면 없는 방향을 가리키게 된다.
            접힌 폭에서는 번호가 순서를 대신한다. */}
        <ol className="mt-16 grid gap-x-6 gap-y-9 border-t border-white/10 pt-14 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {OPERATION_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="ai-champion-reveal group relative pl-11 lg:pl-0 lg:pt-11"
            >
              <span
                aria-hidden
                className="absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full bg-ink-warm font-mono text-[11px] font-bold text-blue-300 ring-1 ring-white/20 transition-colors duration-200 group-hover:ring-blue-400/60"
              >
                0{index + 1}
              </span>
              {/* 노드 오른쪽 끝에서 다음 노드까지. gap(1.5rem)을 더해야 칸을 건넌다. */}
              {index < OPERATION_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-7 top-3.5 hidden h-px w-[calc(100%_-_1.75rem_+_1.5rem)] bg-white/10 lg:block"
                />
              )}
              <h3 className="text-[17px] font-bold leading-[1.35] transition-colors duration-200 group-hover:text-blue-200">
                {step.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-zinc-400">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
