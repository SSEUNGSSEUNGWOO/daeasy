"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActiveToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        isActive
          ? "rounded-md border border-zinc-200 px-3 py-1 text-[13px] hover:border-zinc-300"
          : "rounded-md border border-zinc-200 px-3 py-1 text-[13px] text-zinc-400 hover:border-zinc-300"
      }
    >
      {isActive ? "활성" : "비활성"}
    </button>
  );
}
