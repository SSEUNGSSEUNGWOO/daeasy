"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "요청에 실패했습니다.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-10 space-y-5">
        <p role="status" className="rounded-md bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
          가입된 이메일이라면 재설정 링크를 보냈습니다. 메일함(스팸함 포함)을 확인해주세요. 링크는 잠시 후 만료되며, 지금 이 브라우저에서 열어야 합니다.
        </p>
        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="font-bold text-ink hover:underline">로그인으로 돌아가기</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      <label className="block">
        <span className="text-[13px] font-bold text-ink">이메일</span>
        <input name="email" type="email" autoComplete="email" required disabled={submitting} autoFocus className="mt-2 w-full rounded-md border border-zinc-200 px-4 py-3 text-[15px] focus:border-ink focus:outline-none" />
      </label>
      <button type="submit" disabled={submitting} className="w-full rounded-md bg-ink px-6 py-3.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:bg-zinc-400">
        {submitting ? "보내는 중..." : "재설정 링크 보내기"}
      </button>
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className="font-bold text-ink hover:underline">로그인으로 돌아가기</Link>
      </p>
    </form>
  );
}
