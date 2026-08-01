import Link from "next/link";

import { requireRole } from "@/lib/admin-auth";
import {
  fetchBookingsForMonth,
  RENTAL_SLOT_LABEL,
} from "@/lib/rental-bookings";

import { BookingForm } from "./booking-form";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "대관 일정" };

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function RentalSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireRole("admin");

  const sp = await searchParams;
  const month = sp.month && MONTH_RE.test(sp.month) ? sp.month : currentMonth();
  const bookings = await fetchBookingsForMonth(month);

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">대관 일정</h1>
      <p className="mt-3 text-zinc-600">
        확정된 예약을 등록하면 사이트 예약 현황 캘린더에 반영됩니다 (전화 예약 포함).
      </p>

      <BookingForm />

      <div className="mt-12 flex items-center gap-4">
        <Link
          href={`/admin/rental-schedule?month=${shiftMonth(month, -1)}`}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 hover:border-zinc-300"
        >
          이전 달
        </Link>
        <p className="text-[15px] font-bold text-ink">{month}</p>
        <Link
          href={`/admin/rental-schedule?month=${shiftMonth(month, 1)}`}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-700 hover:border-zinc-300"
        >
          다음 달
        </Link>
      </div>

      <table className="mt-6 w-full max-w-2xl text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500">
          <tr>
            <th className="py-2 font-medium">날짜</th>
            <th className="py-2 font-medium">시간대</th>
            <th className="py-2 font-medium">메모</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-zinc-400">
                이 달에 등록된 예약이 없습니다.
              </td>
            </tr>
          )}
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-zinc-100">
              <td className="py-3">{b.booking_date}</td>
              <td className="py-3">{RENTAL_SLOT_LABEL[b.slot]}</td>
              <td className="py-3 text-zinc-600">{b.memo || "-"}</td>
              <td className="py-3 text-right">
                <DeleteButton id={b.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
