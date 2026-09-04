"use client";

import { useState } from "react";

/** 비회원 뉴스레터 구독 폼 → /api/newsletter/subscribe. source 는 어디서 구독했는지 기록용 */
export function NewsletterForm({ source }: { source: string }) {
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), source }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "구독 신청에 실패했습니다.");
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="rounded-md bg-blue-50 px-4 py-3 text-[14px] leading-6 text-blue-700">
        구독 신청이 완료되었습니다. 다음 발행부터 메일로 보내드립니다.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label className="flex-1">
        <span className="sr-only">이메일</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="이메일 주소"
          disabled={state === "submitting"}
          className="w-full rounded-md border border-zinc-200 px-4 py-3 text-[15px] focus:border-ink focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={state === "submitting"}
        className="rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:bg-zinc-400"
      >
        {state === "submitting" ? "신청 중..." : "뉴스레터 받기"}
      </button>
      {error && <p role="alert" className="text-[13px] text-red-600 sm:basis-full">{error}</p>}
    </form>
  );
}
