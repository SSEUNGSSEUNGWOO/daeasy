import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, unauthorized } from "@/lib/admin-auth";
import { isRentalSlot, type RentalSlot } from "@/lib/rental-bookings";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  booking_date?: string;
  slot?: string;
  memo?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const bookingDate = payload.booking_date ?? "";
  if (!DATE_RE.test(bookingDate)) {
    return NextResponse.json({ detail: "날짜가 올바르지 않습니다." }, { status: 400 });
  }
  if (!isRentalSlot(payload.slot)) {
    return NextResponse.json({ detail: "시간대가 올바르지 않습니다." }, { status: 400 });
  }
  const slot: RentalSlot = payload.slot;
  const memo = (payload.memo ?? "").slice(0, 500);

  const sb = getSupabaseAdmin();

  // 같은 날 충돌 규칙: full 있으면 전부 불가 / am+pm 있으면 full 불가 / 같은 슬롯 불가
  const { data: existing, error: readError } = await sb
    .from("rental_bookings")
    .select("slot")
    .eq("booking_date", bookingDate)
    .returns<{ slot: RentalSlot }[]>();

  if (readError) {
    return NextResponse.json({ detail: readError.message }, { status: 500 });
  }
  const slots = new Set((existing ?? []).map((r) => r.slot));
  const conflict =
    slots.has("full") ||
    slots.has(slot) ||
    (slot === "full" && slots.size > 0);
  if (conflict) {
    return NextResponse.json(
      { detail: "이미 예약이 있는 시간대입니다." },
      { status: 409 },
    );
  }

  const { error } = await sb
    .from("rental_bookings")
    .insert({ booking_date: bookingDate, slot, memo });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
