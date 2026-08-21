import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/customer-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
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
  const rl = await rateLimit("rentals", getClientIp(req), 5, "1 m");
  if (!rl.success) {
    return NextResponse.json(
      { detail: "잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

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

  // 로그인 회원이면 신청을 계정에 연결한다. 실패해도 비회원 신청으로 접수된다.
  // 실패를 조용히 삼키면 Auth 장애를 감지할 수 없으므로 로그는 남긴다.
  const customer = await getCurrentCustomer().catch((err) => {
    console.error("[rentals/inquiries] 세션 조회 실패 — 비회원으로 접수:", err);
    return null;
  });

  const { data, error } = await getSupabaseAdmin()
    .from("rental_inquiries")
    .insert({
      name,
      phone,
      usage_date: usageDate,
      time_slot: timeSlot,
      message,
      user_id: customer?.id ?? null,
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
