import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/customer-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = { name?: string; phone?: string; organization?: string };

export async function PATCH(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }

  const rl = await rateLimit("profile", getClientIp(req), 10, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const name = (payload.name ?? "").trim();
  const phone = (payload.phone ?? "").trim();
  const organization = (payload.organization ?? "").trim();
  if (name.length < 1 || name.length > 50) {
    return NextResponse.json({ detail: "이름이 올바르지 않습니다." }, { status: 400 });
  }
  if (phone.length < 1 || phone.length > 40) {
    return NextResponse.json({ detail: "연락처가 올바르지 않습니다." }, { status: 400 });
  }
  if (organization.length > 200) {
    return NextResponse.json({ detail: "소속이 너무 깁니다." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("customer_profiles")
    .update({ name, phone, organization })
    .eq("id", customer.id);
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
