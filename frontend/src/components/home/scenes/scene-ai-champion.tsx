"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "../../gsap-setup";

/**
 * 여정 4단계가 이 섹션의 주인공. 실적 수치는 비공개 지침으로 싣지 않는다 —
 * 각 단계에서 "무엇을 직접 하는가"만 말한다. 헤드라인은 히어로 배지
 * ("행정안전부 AI 챔피언 인증 운영기관")와 겹치지 않게 '누구'가 아니라
 * '어떻게'를 말한다.
 *
 * 레이아웃은 좌우 분할 — 왼쪽에 헤드라인·설명·링크, 오른쪽에 단계를
 * 번호 붙은 세로 목록으로. 앞뒤 섹션이 모두 흰 배경이라 다크 박스 대신
 * paper 톤으로 받아 흐름을 끊지 않는다 (다크는 맨 아래 CTA 카드 한 번만).
 */
const JOURNEY_STEPS = [
  {
    title: "역량체계 설계",
    body: "역량진단 모델과 평가 지표를 직접 개발했습니다.",
  },
  {
    title: "교육 운영",
    body: "종합과정 운영을 공식 대행하며 학습과 과제 수행을 지원합니다.",
  },
  {
    title: "인증평가",
    body: "CBT·본인확인·실시간 화상 감독으로 공정하게 평가합니다.",
  },
  {
    title: "결과 관리",
    body: "채점·심사부터 결과 통계와 보고까지 관리합니다.",
  },
] as const;

export function SceneAiChampion() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".champ-head",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 78%", once: true },
          },
        );
        // 단계가 위에서 아래로 하나씩 켜진다 — stagger 를 크게 잡아 순차성이 읽히게.
        gsap.fromTo(
          ".champ-step",
          { autoAlpha: 0, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.14,
            ease: "power2.out",
            scrollTrigger: { trigger: ".champ-steps", start: "top 80%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="border-t border-zinc-100 bg-paper text-ink">
      <div className="mx-auto grid max-w-[1280px] gap-x-16 gap-y-14 px-6 py-20 lg:grid-cols-[5fr_6fr] lg:px-10 lg:py-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="champ-head text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
            국가 AI 인재 인증
          </p>
          <h2 className="champ-head mt-3 text-[36px] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-[44px] lg:text-[50px]">
            진단부터 인증까지,<br />전 과정을 직접 운영합니다.
          </h2>
          <p className="champ-head mt-6 max-w-md text-[16px] leading-[1.8] text-zinc-600">
            행정안전부 AI 챔피언 프로그램의 역량 진단·교육·인증 평가·결과 관리를 한 기관이 끝까지 맡습니다.
          </p>
          <Link
            href="/ai-champion"
            className="champ-head group mt-10 inline-flex items-center gap-2 text-[15px] font-bold text-ink"
          >
            AI 챔피언 자세히 보기
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <ol className="champ-steps divide-y divide-zinc-900/10 border-y border-zinc-900/10">
          {JOURNEY_STEPS.map((step, index) => (
            <li key={step.title} className="champ-step grid grid-cols-[3.5rem_1fr] gap-x-4 py-7 sm:grid-cols-[4.5rem_1fr] sm:py-8">
              <span aria-hidden className="font-mono text-[13px] font-bold leading-[1.35] text-accent sm:pt-[3px]">
                0{index + 1}
              </span>
              <div>
                <h3 className="text-[20px] font-bold leading-[1.35] tracking-[-0.01em] sm:text-[22px]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-lg text-[15px] leading-[1.75] text-zinc-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
