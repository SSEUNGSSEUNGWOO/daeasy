"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "../../gsap-setup";

export function SceneHero() {
  const scope = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);

  function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setVideoPaused(false);
    } else {
      video.pause();
      setVideoPaused(true);
    }
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // 배경 영상이 주인공이라 히어로는 핀·스크럽 없이 1회 인트로만 둔다.
      // StrictMode 이중 실행에도 안전하게 fromTo 로 끝값을 명시한다.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".hero-copy > *",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, ease: "power2.out" },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative isolate overflow-hidden bg-white">
      {/* 배경 영상이 히어로의 중심. 워시는 카피 대비를 지킬 만큼만 덮는다. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 overflow-hidden bg-[url('/hero/hero-bg-poster.jpg')] bg-cover bg-center"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero/hero-bg-poster.jpg"
        >
          <source src="/hero/hero-bg.webm" type="video/webm" />
          <source src="/hero/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* 모바일은 카피가 전폭이라 고르게 덮는다. */}
        <div className="absolute inset-0 bg-white/70 lg:hidden" />
        {/* 데스크톱은 카피가 놓이는 좌측만 가리고 우측은 영상을 그대로 드러낸다.
            화면 전체를 흰색으로 덮으면 영상이 뿌옇게 죽는다. */}
        <div className="absolute inset-0 hidden lg:block bg-[linear-gradient(to_right,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.8)_34%,rgba(255,255,255,0.28)_66%,rgba(255,255,255,0)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-64px)] max-w-[1280px] flex-col justify-center px-6 py-20 lg:px-10">
        <div className="hero-copy max-w-[900px]">
          <h1 className="text-[46px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[60px] lg:text-[80px]">
            조직의 <span className="whitespace-nowrap">AI 전환,</span>{" "}
            <br className="hidden sm:inline" />
            교육에서 성과까지.
          </h1>
          {/* 본문은 B2B·B2G 를 모두 품는 "AI·데이터 교육 기업" 정체성으로.
              공공 한정 문구를 쓰지 않는다. */}
          <p className="mt-7 max-w-2xl text-[16px] font-medium leading-[1.8] text-zinc-700 sm:text-[18px]">
            생성형 AI 활용부터 데이터 분석과 AI 서비스 개발까지, 기업과 공공기관의
            직무와 현업 과제에 맞춰 교육을 설계·운영하는 AI·데이터 교육 전문기업입니다.
          </p>
          {/* 같은 크기의 버튼 2개 — 주 동선(교육 문의, B2B)과 신뢰 근거(행안부
              AI 챔피언, B2G)를 나란히. 색으로만 위계를 나눈다: 파랑=주, 잉크=보조.
              어두운 잉크를 쓰는 이유는 좌측 워시가 흰색 92% 라 밝은 보조 버튼은
              묻히기 때문. */}
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-accent px-5 py-4 text-[16px] font-bold tracking-[-0.01em] text-white shadow-[0_12px_32px_-14px_rgba(37,99,235,0.85)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(37,99,235,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 sm:w-[250px]"
            >
              교육 문의하기
              <span
                aria-hidden
                className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-[13px] leading-none transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
            <Link
              href="/ai-champion"
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink-warm px-5 py-4 text-[16px] font-bold tracking-[-0.01em] text-white shadow-[0_12px_32px_-14px_rgba(15,15,15,0.75)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(15,15,15,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 sm:w-[250px]"
            >
              AI 챔피언
              <span
                aria-hidden
                className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[13px] leading-none transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* WCAG 2.2.2 — 자동재생 배경 영상의 정지 수단. reduced-motion 에선 영상 자체가 숨어 버튼도 숨긴다. */}
      <button
        type="button"
        onClick={toggleVideo}
        aria-label={videoPaused ? "배경 영상 재생" : "배경 영상 일시정지"}
        className="absolute bottom-5 right-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-ink/45 text-white backdrop-blur-sm transition hover:bg-ink/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:hidden"
      >
        {videoPaused ? (
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
            <path d="M4 2.5v11l9-5.5-9-5.5z" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
            <path d="M3.5 2h3v12h-3zM9.5 2h3v12h-3z" />
          </svg>
        )}
      </button>
    </section>
  );
}
