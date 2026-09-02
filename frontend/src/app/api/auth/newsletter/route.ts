import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/customer-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/** 로그인한 회원 본인 이메일의 뉴스레터 구독 상태 조회/변경.
 *  비회원 구독 신청은 기존 /api/newsletter/subscribe 가 담당한다. */
export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("newsletter_subscribers")
    .select("status")
    .eq("email", customer.email)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ subscribed: data?.status === "active" });
}

export async function PATCH(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }

  const rl = await rateLimit("newsletter-toggle", getClientIp(req), 10, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let payload: { subscribed?: boolean };
  try {
    payload = (await req.json()) as { subscribed?: boolean };
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }
  if (typeof payload.subscribed !== "boolean") {
    return NextResponse.json({ detail: "subscribed 값이 필요합니다." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("newsletter_subscribers")
    .upsert(
      payload.subscribed
        ? { email: customer.email, status: "active", unsubscribed_at: null, source: "mypage" }
        : {
            email: customer.email,
            status: "unsubscribed",
            unsubscribed_at: new Date().toISOString(),
          },
      { onConflict: "email" },
    );
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ subscribed: payload.subscribed });
}
