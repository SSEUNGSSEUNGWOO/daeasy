"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("password_confirm")) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.get("password") }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "변경에 실패했습니다.");
      }
      router.push("/mypage");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      <label className="block">
        <span className="text-[13px] font-bold text-ink">새 비밀번호</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={submitting} autoFocus className="mt-2 w-full rounded-md border border-zinc-200 px-4 py-3 text-[15px] focus:border-ink focus:outline-none" />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">새 비밀번호 확인</span>
        <input name="password_confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={submitting} className="mt-2 w-full rounded-md border border-zinc-200 px-4 py-3 text-[15px] focus:border-ink focus:outline-none" />
      </label>
      <p className="text-[12.5px] leading-[1.7] text-zinc-500">8~128자, 영문 대·소문자, 숫자, 특수문자를 포함해야 합니다.</p>
      <button type="submit" disabled={submitting} className="w-full rounded-md bg-ink px-6 py-3.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:bg-zinc-400">
        {submitting ? "저장 중..." : "비밀번호 변경"}
      </button>
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
    </form>
  );
}
