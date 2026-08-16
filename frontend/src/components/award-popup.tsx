"use client";

/**
 * 2026 K-디지털 브랜드 대상 수상 알림 팝업.
 *
 * 이미지 한 장으로 만들지 않은 이유: 텍스트가 실제 DOM 이라 어느 해상도에서도
 * 선명하고, 문구·링크를 고칠 때 이미지를 다시 만들 필요가 없다.
 *
 * 노출 규칙
 *  - "오늘은 그만보기" → localStorage 에 날짜(YYYY-MM-DD)를 남겨 그날은 안 뜬다
 *  - "창닫기" → 이번 방문에서만 닫는다 (새로고침하면 다시 뜸)
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import { AWARD_ARTICLE_URL } from "@/lib/award";

const DISMISS_KEY = "daeasy:award-popup-hidden-until";

function todayKey(): string {
  // 로컬 자정 기준. toISOString 은 UTC 라 한국 시간과 하루가 어긋난다.
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* localStorage 는 외부 저장소다. effect 안에서 setState 로 끌어오는 대신
   useSyncExternalStore 로 읽는다 — 서버 스냅샷을 "hidden" 으로 두면
   SSR 에서는 아무것도 렌더하지 않아 hydration 불일치도 없다. */
const subscribe = () => () => {};
const getServerSnapshot = () => "hidden";
const getSnapshot = () => {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === todayKey() ? "hidden" : "shown";
  } catch {
    return "shown"; // 시크릿 모드 등 접근 불가 — 그냥 띄운다
  }
};

export function AwardPopup() {
  const hiddenToday =
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) === "hidden";
  const [dismissed, setDismissed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const open = !hiddenToday && !dismissed;

  const close = useCallback((forToday: boolean) => {
    if (forToday) {
      try {
        window.localStorage.setItem(DISMISS_KEY, todayKey());
      } catch {
        // 저장 실패해도 닫기는 되어야 한다
      }
    }
    setDismissed(true);
  }, []);

  // 열려 있는 동안 Esc 로 닫고, 배경 스크롤을 막는다.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-popup-title"
    >
      <button
        type="button"
        aria-label="팝업 닫기"
        className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-[2px]"
        onClick={() => close(false)}
      />

      <div className="relative w-full max-w-[560px] overflow-hidden rounded-2xl bg-[#0B1B3A] shadow-2xl">
        {/* 배경 광원 — 이미지 없이 그라디언트로만 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(56,110,220,0.55),transparent_60%),radial-gradient(80%_60%_at_110%_110%,rgba(212,175,55,0.22),transparent_60%)]"
        />

        <div className="relative px-7 pb-7 pt-8 sm:px-10 sm:pb-9 sm:pt-10">
          {/* 브랜드 락업. 케이브레인 로고 파일이 들어오면 아래 텍스트를 Image 로 교체한다
              (자리: /public/logo/kbrain-wordmark-onDark.svg). */}
          <div className="flex items-center justify-center gap-4">
            <Image
              src="/logo/daeasy-wordmark-onDark.svg"
              alt="daeasy"
              width={420}
              height={120}
              className="h-6 w-auto"
            />
            <span aria-hidden className="h-4 w-px bg-white/25" />
            <span className="text-[13.5px] font-bold tracking-[-0.01em] text-white/85">
              케이브레인컴퍼니
            </span>
          </div>

          <p className="mt-7 text-center text-[13px] font-bold tracking-[0.14em] text-[#F5C451]">
            축하합니다
          </p>

          <Image
            src="/awards/k-digital-brand-award-2026.png"
            alt=""
            width={270}
            height={269}
            className="mx-auto mt-4 h-24 w-24 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            unoptimized
            priority
          />

          <h2
            id="award-popup-title"
            className="mt-6 text-center text-[26px] font-extrabold leading-[1.3] tracking-[-0.02em] text-white sm:text-[30px]"
          >
            <span className="text-[#F5C451]">2026 K-디지털 브랜드 대상</span>
            <br />
            AI · 데이터 교육 부문 수상
          </h2>

          <p className="mt-4 text-center text-[13.5px] leading-[1.7] text-white/70">
            과학기술정보통신부 주최
            <br />
            한국정보방송통신대연합 주관
          </p>

          <a
            href={AWARD_ARTICLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-7 flex w-fit items-center gap-2.5 rounded-full bg-white py-3 pl-6 pr-5 text-[14.5px] font-bold text-[#0B1B3A] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            보도자료 바로가기
            <span aria-hidden className="text-[13px]">
              →
            </span>
          </a>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 bg-black/25 px-5 py-3">
          <button
            type="button"
            onClick={() => close(true)}
            className="rounded px-2 py-1 text-[13px] font-medium text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            오늘은 그만보기
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={() => close(false)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            창닫기
            <span aria-hidden>✕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
