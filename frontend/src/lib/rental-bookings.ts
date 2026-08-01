import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";

export const RENTAL_SLOTS = ["full", "am", "pm"] as const;
export type RentalSlot = (typeof RENTAL_SLOTS)[number];

export function isRentalSlot(v: unknown): v is RentalSlot {
  return typeof v === "string" && (RENTAL_SLOTS as readonly string[]).includes(v);
}

export const RENTAL_SLOT_LABEL: Record<RentalSlot, string> = {
  full: "전일",
  am: "오전",
  pm: "오후",
};

/** 공개 캘린더용 — memo 를 제외한 두 컬럼만 내보낸다 */
export type PublicBooking = {
  booking_date: string; // YYYY-MM-DD
  slot: RentalSlot;
};

export type AdminBooking = PublicBooking & {
  id: string;
  memo: string;
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 오늘부터 monthsAhead 개월치. 공개 페이지(rentals) 전용. */
export async function fetchPublicBookings(
  monthsAhead = 3,
): Promise<PublicBooking[]> {
  const from = new Date();
  const to = new Date(from);
  to.setMonth(to.getMonth() + monthsAhead);

  const { data, error } = await getSupabaseAdmin()
    .from("rental_bookings")
    .select("booking_date,slot")
    .gte("booking_date", ymd(from))
    .lte("booking_date", ymd(to))
    .returns<PublicBooking[]>();

  if (error) return [];
  return data ?? [];
}

/** 어드민 화면용 — 특정 월(YYYY-MM)의 예약 전체 (memo 포함). */
export async function fetchBookingsForMonth(
  month: string,
): Promise<AdminBooking[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("rental_bookings")
    .select("id,booking_date,slot,memo")
    .gte("booking_date", `${month}-01`)
    .lt(
      "booking_date",
      // 다음 달 1일 (12월이면 이듬해 1월)
      (() => {
        const [y, m] = month.split("-").map(Number);
        const next = new Date(Date.UTC(y!, m!, 1));
        return ymd(next);
      })(),
    )
    .order("booking_date", { ascending: true })
    .returns<AdminBooking[]>();

  if (error) return [];
  return data ?? [];
}
