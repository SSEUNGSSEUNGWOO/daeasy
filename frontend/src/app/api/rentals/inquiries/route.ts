import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  name?: string;
  phone?: string;
  usage_date?: string | null;
  time_slot?: string | null;
  message?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const name = (payload.name ?? "").trim();
  const phone = (payload.phone ?? "").trim();
  if (!name || name.length > 100) {
    return NextResponse.json({ detail: "이름이 올바르지 않습니다." }, { status: 400 });
  }
  if (!phone || phone.length > 40) {
    return NextResponse.json({ detail: "연락처가 올바르지 않습니다." }, { status: 400 });
  }

  const usageDate = payload.usage_date && DATE_RE.test(payload.usage_date)
    ? payload.usage_date
    : null;
  const timeSlot = payload.time_slot ? payload.time_slot.slice(0, 40) : null;
  const message = (payload.message ?? "").slice(0, 2000);

  const { data, error } = await getSupabaseAdmin()
    .from("rental_inquiries")
    .insert({
      name,
      phone,
      usage_date: usageDate,
      time_slot: timeSlot,
      message,
    })
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { detail: error?.message ?? "failed to create inquiry" },
      { status: 500 },
    );
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
