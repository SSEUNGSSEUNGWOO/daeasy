"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `로그인 실패 (${res.status})`);
      }

      const target = from.startsWith("/admin") ? from : "/admin";
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 w-full max-w-sm space-y-4"
    >
      <label className="block">
        <span className="text-[13px] font-bold text-[#0F0F0F]">비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-[#0F0F0F] focus:outline-none disabled:bg-zinc-100"
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        disabled={submitting || !password}
        className="w-full rounded-md bg-[#0F0F0F] px-6 py-3 text-[14px] font-bold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {submitting ? "확인 중..." : "로그인"}
      </button>
      {error && (
        <p className="text-[13px] text-red-600">{error}</p>
      )}
    </form>
  );
}
