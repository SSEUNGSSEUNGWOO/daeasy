"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INPUT =
  "mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100";

export function BookingForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("full");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/rental-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_date: date, slot, memo }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `등록 실패 (${res.status})`);
      }
      setDate("");
      setSlot("full");
      setMemo("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-2xl flex-wrap items-end gap-4">
      <label className="block">
        <span className="text-[13px] font-bold text-ink">날짜</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <label className="block">
        <span className="text-[13px] font-bold text-ink">시간대</span>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className={INPUT}
          disabled={submitting}
        >
          <option value="full">전일</option>
          <option value="am">오전</option>
          <option value="pm">오후</option>
        </select>
      </label>
      <label className="block flex-1 min-w-48">
        <span className="text-[13px] font-bold text-ink">메모 (내부용)</span>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: OO기관 30명"
          className={INPUT}
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        disabled={submitting || !date}
        className="rounded-md bg-ink px-6 py-2.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {submitting ? "등록 중..." : "등록"}
      </button>
      {error && <p className="w-full text-[13px] text-red-600">{error}</p>}
    </form>
  );
}
