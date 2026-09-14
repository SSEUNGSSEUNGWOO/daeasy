"use client";

import { useState } from "react";

/* 현재 페이지를 공유한다. 모바일은 OS 공유 시트(카톡·메시지 등), 데스크톱은 링크 복사.
   체험관 결과는 미리 만든 응답이라 URL 에 상태가 없다 — 공유 링크는 체험 시작 화면이다. */

type Props = { text: string; className?: string };

export function ShareButton({ text, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: document.title, text, url });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우 — 조용히 종료
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("링크를 복사하세요", url);
    }
  }

  return (
    <button type="button" onClick={share} className={className} aria-live="polite">
      {copied ? "링크 복사됨" : "공유하기"}
    </button>
  );
}
