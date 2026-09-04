"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* 인사이트 페이지 상단 뉴스레터 CTA. 뉴스레터는 회원 전용이라
   비회원 → 가입(뉴스레터 동의 미리 켜짐), 회원 → 여기서 바로 구독 토글.
   페이지가 ISR 이라 로그인 상태는 서버가 아니라 마운트 후 /api/auth/newsletter 로 알아낸다. */

type Status = "loading" | "guest" | "subscribed" | "unsubscribed";

const buttonCls =
  "inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:bg-zinc-400";

export function NewsletterCta() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/newsletter")
      .then(async (res) => {
        if (!alive) return;
        if (res.status === 401) return setStatus("guest");
        const body = (await res.json().catch(() => ({}))) as { subscribed?: boolean };
        setStatus(body.subscribed ? "subscribed" : "unsubscribed");
      })
      .catch(() => alive && setStatus("guest"));
    return () => {
      alive = false;
    };
  }, []);

  async function subscribe() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "구독 신청에 실패했습니다.");
      }
      setStatus("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("unsubscribed");
    }
  }

  if (status === "subscribed") {
    return (
      <p role="status" className="text-[14px] leading-6 text-zinc-600">
        뉴스레터를 구독 중입니다. 새 글이 올라오면 가입한 이메일로 보내드립니다.{" "}
        <Link href="/mypage" className="font-bold text-ink underline underline-offset-2">마이페이지에서 관리</Link>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === "guest" ? (
        <Link href="/signup?newsletter=1" className={buttonCls}>뉴스레터 받기</Link>
      ) : (
        <button type="button" onClick={subscribe} disabled={status === "loading"} className={buttonCls}>
          {status === "loading" ? "확인 중..." : "뉴스레터 받기"}
        </button>
      )}
      <span className="text-[13px] text-zinc-500">
        {status === "guest" ? "회원가입 후 가입한 이메일로 받아보실 수 있습니다." : "가입한 이메일로 보내드립니다."}
      </span>
      {error && <p role="alert" className="basis-full text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
