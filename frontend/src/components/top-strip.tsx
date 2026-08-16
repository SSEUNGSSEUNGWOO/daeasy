"use client";

/**
 * 헤더 최상단 띠. 한 줄만 쓴다.
 *
 * 수상 알림이 살아 있는 동안에는 좌(수상) / 우(상담 CTA) 로 나눠 담고,
 * 닫으면 원래의 가운데 정렬 상담 문구로 돌아간다.
 * 띠를 두 줄로 쌓으면 첫 화면 상단이 크롬으로만 150px 가까이 차서 히어로가 눌린다.
 */

import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";

import { AWARD_ARTICLE_URL } from "@/lib/award";

const DISMISS_KEY = "daeasy:award-strip-hidden-until";

function todayKey(): string {
  // 로컬 자정 기준. toISOString 은 UTC 라 한국 시간과 하루가 어긋난다.
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* localStorage 는 외부 저장소다. effect 안에서 setState 로 끌어오는 대신
   useSyncExternalStore 로 읽는다 — 서버 스냅샷을 "hidden" 으로 두면
   SSR 은 항상 상담 문구만 렌더해 hydration 불일치가 없다. */
const subscribe = () => () => {};
const getServerSnapshot = () => "hidden";
const getSnapshot = () => {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === todayKey() ? "hidden" : "shown";
  } catch {
    return "shown"; // 시크릿 모드 등 접근 불가 — 그냥 띄운다
  }
};

// 금색은 임의 색이 아니라 로고 팔레트의 머스타드(#F5B83C)를 쓴다.
const GOLD = "#F5B83C";

/**
 * 띠 안의 링크 한 줄. 설명 문구까지 통째로 클릭된다 —
 * 액션 단어만 링크로 두면 클릭 영역이 좁고, 좌우 밑줄 처리도 어긋나기 쉽다.
 */
function StripLink({
  href,
  external,
  lead,
  action,
  className,
  style,
}: {
  href: string;
  external?: boolean;
  lead: ReactNode;
  action: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const inner = (
    <>
      <span className="truncate opacity-80 transition-opacity group-hover:opacity-100">{lead}</span>
      <span className="ml-2 shrink-0 font-bold underline underline-offset-4">{action}</span>
    </>
  );
  const cls = `group flex min-w-0 items-center ${className ?? ""}`;

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls} style={style}>
      {inner}
    </Link>
  );
}

export function TopStrip() {
  const hiddenToday =
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) === "hidden";
  const [dismissed, setDismissed] = useState(false);

  const close = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, todayKey());
    } catch {
      // 저장 실패해도 닫기는 되어야 한다
    }
    setDismissed(true);
  }, []);

  const showAward = !hiddenToday && !dismissed;

  return (
    <div
      className={`relative overflow-hidden text-white ${showAward ? "strip-split-bg" : "bg-accent"}`}
    >
      {showAward ? (
        // 수상 문구는 컨테이너(max-w-1280) 기준 — 아래 헤더 로고와 좌측 정렬을 맞춘다.
        // 중앙선을 넘지 않도록 폭을 절반으로 묶는다. 넘치면 truncate.
        <div className="relative mx-auto flex h-10 max-w-[1280px] items-center pl-6 pr-11 text-[12.5px] lg:pr-6">
          <StripLink
            href={AWARD_ARTICLE_URL}
            external
            className="lg:max-w-[calc(50%-2rem)]"
            style={{ color: GOLD }}
            lead={
              <>
                <span className="font-bold">2026 K-디지털 브랜드 대상 수상</span>
                <span className="ml-1.5 hidden sm:inline">AI · 데이터 교육 부문</span>
              </>
            }
            action="보도자료 →"
          />
        </div>
      ) : (
        <div className="mx-auto flex h-10 max-w-[1280px] items-center justify-center px-6 text-[12.5px]">
          <StripLink
            href="/contact"
            lead="조직에 맞는 AI 도입, 어디부터 시작할지 모르겠다면 —"
            action="교육 문의하기 →"
          />
        </div>
      )}

      {/* CTA 는 파란 절반의 정중앙. 배경 그라디언트가 화면 끝까지 가므로 기준도
          컨테이너(max-w-1280)가 아니라 화면이어야 한다 — 그래서 별도 레이어다. */}
      {showAward ? (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 right-0 hidden items-center justify-center px-6 text-[12.5px] lg:flex">
          <StripLink
            href="/contact"
            className="pointer-events-auto"
            lead="커리큘럼 · 일정 · 견적이 궁금하다면 —"
            action="교육 문의하기 →"
          />
        </div>
      ) : null}

      {showAward ? (
        <button
          type="button"
          onClick={close}
          aria-label="수상 알림 닫기"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <span aria-hidden className="text-[13px] leading-none">
            ✕
          </span>
        </button>
      ) : null}
    </div>
  );
}
