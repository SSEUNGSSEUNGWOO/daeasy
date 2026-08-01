import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = { email?: string; source?: string };

export async function POST(req: Request) {
  const rl = await rateLimit("newsletter", getClientIp(req), 5, "1 m");
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

  const email = (payload.email ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { detail: "이메일 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  // 재구독(status=unsubscribed 였던 이메일)도 다시 active 로 돌린다.
  const { error } = await getSupabaseAdmin()
    .from("newsletter_subscribers")
    .upsert(
      {
        email,
        status: "active",
        unsubscribed_at: null,
        source: payload.source ? payload.source.trim().slice(0, 40) : null,
      },
      { onConflict: "email" },
    );

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "subscribed" }, { status: 201 });
}
