"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("이 예약을 삭제할까요?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/rental-bookings/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="rounded-md border border-zinc-200 px-3 py-1 text-[13px] text-zinc-600 hover:border-zinc-300 hover:text-red-600"
    >
      삭제
    </button>
  );
}
