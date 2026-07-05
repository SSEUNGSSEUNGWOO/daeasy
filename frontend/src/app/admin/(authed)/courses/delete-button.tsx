"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  endpoint: string;
  redirectTo: string;
  label?: string;
  confirmText?: string;
};

export function DeleteButton({
  id,
  endpoint,
  redirectTo,
  label = "삭제",
  confirmText = "정말 삭제할까요? 되돌릴 수 없습니다.",
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(confirmText)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `실패 (${res.status})`);
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "실패");
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "삭제 중..." : label}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
