import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type Payload = { email?: string; password?: string };

export async function POST(req: Request) {
  const rl = await rateLimitAuth("customer-login", getClientIp(req), 10, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const password = payload.password ?? "";
  if (!email || !password) {
    return NextResponse.json(
      { detail: "이메일과 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json(
      { detail: "이메일 또는 비밀번호가 일치하지 않습니다." },
      { status: 401 },
    );
  }

  const { data: profile } = await getSupabaseAdmin()
    .from("customer_profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle<{ id: string }>();

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json({ detail: "일반 고객 계정이 아닙니다." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
