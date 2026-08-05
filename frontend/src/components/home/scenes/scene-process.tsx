"use client";

/* 핵심 장면: 화면을 고정하고 스크롤 진행에 따라 4단계가 순차 전환된다.
   완화판(모바일·reduced-motion)은 4단계 그리드 그대로 보여준다. */

import { useRef } from "react";

import { gsap, MM_DESKTOP, MM_SOFT, useGSAP } from "./gsap-setup";

const MOMENTS = [
  { tag: "01", title: "사전 인터뷰", body: "조직의 실제 업무 데이터·도구를 듣고 시작합니다." },
  { tag: "02", title: "맞춤 커리큘럼 설계", body: "산업·직군·도구를 반영해 매번 처음부터 재설계합니다." },
  { tag: "03", title: "현장 강의", body: "실무자 출신 강사가 사례·문제·해결로 풉니다." },
  { tag: "04", title: "사후 코칭·모니터링", body: "종강 후 8주, 부서별 적용과 도입률 추적까지." },
];

export function SceneProcess() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // ── 데스크톱: 핀 + 단계 순차 전환 ────────────────────
      mm.add(MM_DESKTOP, () => {
        const steps = gsap.utils.toArray<HTMLElement>(".process-step");
        const dots = gsap.utils.toArray<HTMLElement>(".process-dot");

        // 데스크톱에서만 오버레이 전환 레이아웃으로 전환
        gsap.set(".process-stage", { display: "block" });
        gsap.set(".process-grid", { display: "none" });
        gsap.set(steps, { position: "absolute", inset: 0, autoAlpha: 0, y: 60 });
        gsap.set(steps[0]!, { autoAlpha: 1, y: 0 });
        gsap.set(dots[0]!, { color: "#2563eb" });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: `+=${MOMENTS.length * 85}%`,
            pin: true,
            scrub: 0.6,
          },
        });

        steps.forEach((step, i) => {
          if (i === 0) return;
          const at = i; // 단계당 타임라인 1초 간격
          tl.to(steps[i - 1]!, { autoAlpha: 0, y: -60, duration: 0.42, ease: "none" }, at)
            .fromTo(
              step,
              { autoAlpha: 0, y: 60 },
              { autoAlpha: 1, y: 0, duration: 0.42, ease: "none" },
              at + 0.18,
            )
            .to(dots[i - 1]!, { color: "#a1a1aa", duration: 0.2 }, at)
            .to(dots[i]!, { color: "#2563eb", duration: 0.2 }, at + 0.18);
        });
        // 마지막 단계 뒤 여백 (핀 해제 직전 잠깐 머무름)
        tl.to({}, { duration: 0.6 });
      });

      // ── 완화판: 그리드 유지 + 스태거 reveal ──────────────
      mm.add(MM_SOFT, () => {
        gsap.fromTo(
          ".process-grid > li",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 75%", once: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="border-t border-zinc-100 bg-zinc-50/70">
      <div className="mx-auto flex min-h-0 max-w-[1280px] flex-col justify-center px-6 py-20 lg:min-h-screen lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">How we work</p>
          <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
            인터뷰부터 사후 코칭까지<br />네 단계로 진행합니다.
          </h2>
        </div>

        {/* 데스크톱 전환 스테이지 — gsap 이 display:block 으로 켠다 (기본은 숨김) */}
        <div className="process-stage relative mt-12 hidden h-[340px]">
          {MOMENTS.map((m) => (
            <div key={m.tag} className="process-step flex h-full flex-col justify-center">
              <p className="font-mono text-[13px] font-bold tracking-[0.18em] text-accent">
                Step {m.tag}
              </p>
              <h3 className="mt-6 text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[52px]">
                {m.title}
              </h3>
              <p className="mt-6 max-w-xl text-[18px] leading-[1.8] text-zinc-600">{m.body}</p>
            </div>
          ))}
          {/* 진행 표시 */}
          <div className="absolute bottom-0 left-0 flex gap-5">
            {MOMENTS.map((m) => (
              <span key={m.tag} className="process-dot font-mono text-[12px] font-bold tracking-[0.14em] text-zinc-400">
                {m.tag}
              </span>
            ))}
          </div>
        </div>

        {/* 완화판(그리고 JS·모션 없는 환경의 기본값): 기존 4단계 그리드 */}
        <ul className="process-grid mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOMENTS.map((m) => (
            <li key={m.tag} className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
              <p className="font-mono text-[11.5px] font-bold tracking-[0.18em] text-accent">
                Step {m.tag}
              </p>
              <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-ink">{m.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{m.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
