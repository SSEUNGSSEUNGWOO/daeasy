"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INPUT =
  "mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100";

export function MemberForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("editor");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `생성 실패 (${res.status})`);
      }
      setEmail("");
      setName("");
      setPassword("");
      setRole("editor");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4">
      <label className="block">
        <span className="text-[13px] font-bold text-ink">이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">이름</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">역할</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={INPUT}
          disabled={submitting}
        >
          <option value="editor">직원 (교육과정 · 교육후기만)</option>
          <option value="admin">관리자 (전체)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">초기 비밀번호 (8자 이상)</span>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        disabled={submitting || !email || !password}
        className="rounded-md bg-ink px-6 py-2.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {submitting ? "생성 중..." : "계정 만들기"}
      </button>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </form>
  );
}
