import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 비밀번호 재설정 메일 요청.
 *  계정 존재 여부를 드러내지 않기 위해 이메일 형식만 맞으면 항상 같은 응답을 준다.
 *  메일 링크는 /auth/confirm 이 세션으로 바꾼 뒤 /reset-password 로 보낸다. */
export async function POST(req: Request) {
  const rl = await rateLimitAuth("customer-forgot", getClientIp(req), 3, "10 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let payload: { email?: string };
  try {
    payload = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }
  const email = (payload.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ detail: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl && process.env.NODE_ENV === "production") {
    return NextResponse.json({ detail: "비밀번호 재설정 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl ?? new URL(req.url).origin}/auth/confirm?next=/reset-password`,
  });
  // 없는 계정도 성공으로 응답한다. 설정 오류는 함수 로그로만
  if (error) console.error("[forgot-password]", error.message);
  return NextResponse.json({ ok: true });
}
