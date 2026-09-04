"use client";

import { useMemo, useState } from "react";

import type { PublicBooking, RentalSlot } from "@/lib/rental-bookings";

type DayStatus = "available" | "am" | "pm" | "closed";

const STATUS_LABEL: Record<Exclude<DayStatus, "available">, string> = {
  am: "오전 예약",
  pm: "오후 예약",
  closed: "마감",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function statusOf(slots: Set<RentalSlot> | undefined): DayStatus {
  if (!slots || slots.size === 0) return "available";
  if (slots.has("full") || (slots.has("am") && slots.has("pm"))) return "closed";
  if (slots.has("am")) return "am";
  return "pm";
}

export function BookingCalendar({
  bookings,
  monthsAhead = 3,
}: {
  bookings: PublicBooking[];
  monthsAhead?: number;
}) {
  const [offset, setOffset] = useState(0);

  const byDate = useMemo(() => {
    const map = new Map<string, Set<RentalSlot>>();
    for (const b of bookings) {
      const set = map.get(b.booking_date) ?? new Set<RentalSlot>();
      set.add(b.slot);
      map.set(b.booking_date, set);
    }
    return map;
  }, [bookings]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + offset;
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: Array<{ day: number; ymd: string } | null> = [];
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ymd = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, ymd });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-bold tracking-[-0.01em] text-ink">
          {first.getFullYear()}년 {first.getMonth() + 1}월
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOffset((v) => Math.max(0, v - 1))}
            disabled={offset === 0}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            이전 달
          </button>
          <button
            type="button"
            onClick={() => setOffset((v) => Math.min(monthsAhead - 1, v + 1))}
            disabled={offset >= monthsAhead - 1}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            다음 달
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-[12px] font-bold uppercase tracking-wide text-zinc-400">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const past = cell.ymd < todayYmd;
          // 주말은 대관하지 않는다 — 요일 인덱스는 달력 칸 위치(일=0)에서 바로 나온다
          const weekend = i % 7 === 0 || i % 7 === 6;
          const status: DayStatus = weekend ? "closed" : statusOf(byDate.get(cell.ymd));
          return (
            <div
              key={cell.ymd}
              className={
                past || weekend
                  ? "min-h-16 rounded-lg bg-zinc-50 p-2 text-left text-zinc-300"
                  : status === "closed"
                    ? "min-h-16 rounded-lg bg-zinc-100 p-2 text-left"
                    : "min-h-16 rounded-lg border border-zinc-100 p-2 text-left"
              }
            >
              <p className={past || weekend ? "text-[13px]" : "text-[13px] font-semibold text-ink"}>
                {cell.day}
              </p>
              {!past && status !== "available" && (
                <p
                  className={
                    status === "closed"
                      ? "mt-1 text-[11px] font-bold text-zinc-400"
                      : "mt-1 text-[11px] font-bold text-accent-warm"
                  }
                >
                  {weekend ? "휴무" : STATUS_LABEL[status]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[12.5px] text-zinc-500">
        표시가 없는 날짜는 예약 가능합니다. 오전·오후 예약일은 나머지 시간대 이용이 가능하며, 주말은 대관하지 않습니다.
      </p>
    </div>
  );
}
