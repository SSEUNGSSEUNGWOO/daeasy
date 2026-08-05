"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { HeroRotatingWord } from "@/components/home/hero-rotating-word";
import { AWARD_ARTICLE_URL } from "@/lib/award";

import { gsap, MM_DESKTOP, MM_SOFT, useGSAP } from "./gsap-setup";

type Stat = { value: number; decimals?: number; suffix?: string; label: string };

// SSR 은 항상 최종 값을 렌더한다. 카운트업은 클라이언트 연출이 덮는 것.
const STATS: Stat[] = [
  { value: 10, suffix: "만+", label: "누적 수강생" },
  { value: 9.5, decimals: 1, label: "/ 10 만족도" },
  { value: 50, suffix: "+", label: "주요 고객사" },
  { value: 100, suffix: "+", label: "강사 파트너" },
];

function formatStat(v: number, s: Stat): string {
  const num = s.decimals ? v.toFixed(s.decimals) : String(Math.round(v));
  return `${num}${s.suffix ?? ""}`;
}

const PHOTO_CARDS = [
  { href: "/cases", img: "/hero/cases.jpg", tag: "REVIEWS", label: "교육 후기", offset: false },
  { href: "/quiz", img: "/hero/quiz.jpg", tag: "RECOMMEND", label: "내게 맞는\n교육 찾기", offset: true },
  { href: "/insights", img: "/hero/news.jpg", tag: "INSIGHTS", label: "AI · 데이터\n인사이트", offset: false },
  { href: "/contact", img: "/hero/post.jpg", tag: "CONTACT", label: "교육 도입\n문의하기", offset: true },
];

export function SceneHero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const counters = gsap.utils.toArray<HTMLElement>("[data-counter]");

      /** 카운터는 스크럽에 묶지 않는다 — 스크롤이 멈춰도 중간값(2.4/10 등)에서
          얼지 않고, 한 번 발화하면 1.3초 동안 끝까지 치솟는다. */
      const playCounters = () => {
        counters.forEach((el, i) => {
          const s = STATS[i]!;
          const obj = { v: 0 };
          gsap.to(obj, {
            v: s.value,
            duration: 1.3,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = formatStat(obj.v, s);
            },
          });
        });
      };

      const mm = gsap.matchMedia();

      // ── 데스크톱: 핀 + 스크럽 ─────────────────────────────
      mm.add(MM_DESKTOP, () => {
        // 진입 인트로 (스크럽 아님, 1회). StrictMode 이중 실행에도 안전하게 fromTo 로 끝값을 명시한다.
        gsap.fromTo(
          ".hero-copy > *",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out" },
        );
        gsap.fromTo(
          ".hero-photo",
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, delay: 0.15, ease: "power2.out" },
        );

        // 핀 스크럽: 사진 패럴랙스 → 헤드라인 후퇴 → 실적 박스 등장.
        // 박스가 충분히 드러난 시점(진행 32%)에 카운트업을 1회 발화한다.
        let counted = false;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "+=75%",
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
              if (!counted && self.progress > 0.32) {
                counted = true;
                playCounters();
              }
            },
          },
        });
        tl.to(".hero-photo", { yPercent: -9, stagger: 0.05, ease: "none" }, 0)
          .to(".hero-copy", { y: -28, autoAlpha: 0.45, ease: "none" }, 0.1)
          .fromTo(
            ".hero-stats",
            { y: 72, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, ease: "none", duration: 0.45 },
            0.15,
          );
      });

      // ── 모바일·태블릿: 핀 없이 1회 등장 + 진입 시 카운트업 ──
      mm.add(MM_SOFT, () => {
        gsap.fromTo(
          ".hero-copy > *",
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "power2.out" },
        );
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".hero-stats",
            start: "top 85%",
            once: true,
          },
        });
        tl.fromTo(
          ".hero-stats",
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
        ).call(playCounters, [], 0.15);
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative isolate overflow-hidden bg-white">
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-white to-white" />
      <div className="relative mx-auto flex min-h-[calc(100svh-64px)] max-w-[1280px] flex-col justify-center px-6 pb-16 pt-16 lg:px-10 lg:pb-16 lg:pt-16">
        <div className="grid grid-cols-12 gap-x-8 gap-y-12">
          <div className="col-span-12 lg:col-span-7">
            <div className="hero-copy">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                AI · Data Education for Teams
              </p>
              <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
                우리 조직 모든 직원이<br />
                AI · 데이터를{" "}
                <HeroRotatingWord
                  words={[
                    "이해한다.",
                    "의사결정에 쓴다.",
                    "도입한다.",
                    "자동화한다.",
                    "다룬다.",
                  ]}
                />
              </h1>
              <p className="mt-7 max-w-[580px] text-[17px] leading-[1.7] text-zinc-600">
                비전공자 직원이 자기 일에 AI · 데이터를 쓸 수 있을 때까지. 누적 10만 명 이상이 수강한 맞춤형 교육 — 50+ 조직, 100+ 강사 파트너와 함께 만들어왔습니다.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3.5 text-[15px] font-bold text-white transition hover:translate-y-[-1px] hover:shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)]"
                >
                  교육 문의하기
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-6 py-3.5 text-[15px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  커리큘럼 보기
                </Link>
              </div>
            </div>

            <div className="hero-stats mt-14 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-7 sm:p-8">
              <a
                href={AWARD_ARTICLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3.5 border-b border-zinc-200/70 pb-6"
              >
                <Image
                  src="/awards/k-digital-brand-award-2026.png"
                  alt="2026 K-디지털 브랜드 대상"
                  width={270}
                  height={269}
                  className="h-12 w-12 shrink-0"
                  unoptimized
                />
                <div>
                  <p className="text-[14.5px] font-bold leading-[1.45] tracking-[-0.01em] text-ink group-hover:underline">
                    2026 K-디지털 브랜드 대상 수상
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-zinc-600">
                    AI · 데이터 교육 부문
                  </p>
                </div>
              </a>
              <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p
                      data-counter
                      className="text-[32px] font-extrabold tracking-[-0.02em] text-accent-warm sm:text-[36px]"
                    >
                      {formatStat(s.value, s)}
                    </p>
                    <p className="mt-1 text-[12.5px] font-medium text-zinc-600">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              {PHOTO_CARDS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className={`hero-photo relative block aspect-[4/5] overflow-hidden rounded-2xl ds-card-soft transition duration-200 hover:-translate-y-1 hover:shadow-lg ${c.offset ? "mt-10" : ""}`}
                >
                  <Image src={c.img} alt="" fill priority sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="relative flex h-full w-full flex-col justify-between p-6">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                      {c.tag}
                    </span>
                    <span className="whitespace-pre-line text-[20px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
                      {c.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
