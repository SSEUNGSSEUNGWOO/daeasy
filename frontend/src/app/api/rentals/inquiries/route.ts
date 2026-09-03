import { NextResponse } from "next/server";

import { getCurrentCustomer, isAuthenticated } from "@/lib/customer-auth";
import { notifyInquiry } from "@/lib/notify";
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
  // 대관 문의는 로그인 필수 — UI 게이트만으로는 직접 POST 를 못 막는다
  if (!(await isAuthenticated())) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }

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

  // 신청을 계정에 연결한다. 위에서 로그인은 확인했지만 customer_profiles 가
  // 없는 세션(어드민 등)일 수 있어 null 허용 — 접수는 막지 않고 연결만 생략.
  const customer = await getCurrentCustomer().catch((err) => {
    console.error("[rentals/inquiries] 고객 프로필 조회 실패 — 연결 없이 접수:", err);
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

  // 관리자 메일 알림 — 실패해도 접수는 성공 (notify 내부 fail-open)
  await notifyInquiry({
    kind: "rental",
    fields: [
      ["이름", name],
      ["연락처", phone],
      ["희망 날짜", usageDate],
      ["희망 시간대", timeSlot],
      ["문의 내용", message],
    ],
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
