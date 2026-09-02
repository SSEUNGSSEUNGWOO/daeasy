"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "로그인에 실패했습니다.");
      }
      // 게이트에서 넘어온 경우 원래 보던 페이지로 복귀. 내부 경로만 허용
      // ("//host" 형태의 오픈 리다이렉트 차단)
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/mypage";
      router.push(safeNext);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      {searchParams.get("verification") === "sent" && <p className="rounded-md bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">인증 이메일을 보냈습니다. 이메일의 링크를 누른 후 로그인해주세요.</p>}
      {searchParams.get("verification") === "failed" && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">인증 링크가 만료되었거나 올바르지 않습니다. 다시 가입을 시도해주세요.</p>}
      <label className="block">
        <span className="text-[13px] font-bold text-ink">이메일</span>
        <input name="email" type="email" autoComplete="email" required disabled={submitting} autoFocus className="mt-2 w-full rounded-md border border-zinc-200 px-4 py-3 text-[15px] focus:border-ink focus:outline-none" />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">비밀번호</span>
        <input name="password" type="password" autoComplete="current-password" required disabled={submitting} className="mt-2 w-full rounded-md border border-zinc-200 px-4 py-3 text-[15px] focus:border-ink focus:outline-none" />
      </label>
      <button type="submit" disabled={submitting} className="w-full rounded-md bg-ink px-6 py-3.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:bg-zinc-400">
        {submitting ? "확인 중..." : "로그인"}
      </button>
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <p className="text-center text-sm text-zinc-500">아직 회원이 아니신가요? <Link href="/signup" className="font-bold text-ink hover:underline">회원가입</Link></p>
    </form>
  );
}
