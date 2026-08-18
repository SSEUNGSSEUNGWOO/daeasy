/**
 * 헤더 최상단 띠. 좌(수상) / 우(교육 문의 CTA) 반반 고정.
 *
 * 원래는 ✕ 로 수상을 닫으면 하루 동안 상담 문구 단독으로 바뀌는 구조였지만,
 * 닫는 순간 반반이 깨져 "하나만 나온다"는 혼선을 낳아 닫기·localStorage 로직을
 * 걷어냈다 (2026-08). 그 덕에 클라이언트 훅이 없어져 서버 컴포넌트다.
 * 띠를 두 줄로 쌓으면 첫 화면 상단이 크롬으로만 150px 가까이 차서 히어로가 눌린다.
 */

import type { ReactNode } from "react";
import Link from "next/link";

import { AWARD_ARTICLE_URL } from "@/lib/award";

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
  return (
    <div className="strip-split-bg relative overflow-hidden text-white">
      {/* 수상 문구는 컨테이너(max-w-1280) 기준 — 아래 헤더 로고와 좌측 정렬을 맞춘다.
          중앙선을 넘지 않도록 폭을 절반으로 묶는다. 넘치면 truncate. */}
      <div className="relative mx-auto flex h-10 max-w-[1280px] items-center px-6 text-[12.5px]">
        <StripLink
          href={AWARD_ARTICLE_URL}
          external
          className="md:max-w-[calc(50%-2rem)]"
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

      {/* CTA 는 파란 절반의 정중앙. 배경 그라디언트가 화면 끝까지 가므로 기준도
          컨테이너(max-w-1280)가 아니라 화면이어야 한다 — 그래서 별도 레이어다.
          md~lg 구간은 자리가 좁아 리드 문구 없이 액션만 싣는다. md 미만은 수상 전폭. */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 right-0 hidden items-center justify-center px-6 text-[12.5px] md:flex">
        <StripLink
          href="/contact"
          className="pointer-events-auto"
          lead={<span className="hidden lg:inline">커리큘럼 · 일정 · 견적이 궁금하다면 —</span>}
          action="교육 문의하기 →"
        />
      </div>
    </div>
  );
}
