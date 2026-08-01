import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Payload = { email?: string; password?: string };

export async function POST(req: Request) {
  const rl = await rateLimit("admin-login", getClientIp(req), 10, "1 m");
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
  const password = (payload.password ?? "").trim();
  if (!email || !password) {
    return NextResponse.json(
      { detail: "이메일과 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { detail: "이메일 또는 비밀번호가 일치하지 않습니다." },
      { status: 401 },
    );
  }

  // auth 인증은 됐지만 어드민 프로필이 없거나 비활성이면 들여보내지 않는다.
  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle<{ is_active: boolean }>();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { detail: "사용할 수 없는 계정입니다." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
