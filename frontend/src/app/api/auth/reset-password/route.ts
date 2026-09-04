import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// 가입과 동일 규칙 (signup/route.ts 의 PASSWORD_RE)
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

/** 재설정 메일 링크로 들어온 세션(recovery)에서 새 비밀번호 저장.
 *  현재 비밀번호를 모르는 상황이므로 /api/auth/password 와 달리 재확인이 없다 —
 *  대신 메일 링크 자체가 본인 확인이다. */
export async function POST(req: Request) {
  const rl = await rateLimitAuth("customer-reset", getClientIp(req), 5, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json({ detail: "재설정 링크가 만료되었습니다. 다시 요청해주세요." }, { status: 401 });
  }

  let payload: { password?: string };
  try {
    payload = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }
  const password = payload.password ?? "";
  if (!PASSWORD_RE.test(password)) {
    return NextResponse.json(
      { detail: "비밀번호는 8~128자이며 영문 대·소문자, 숫자, 특수문자를 포함해야 합니다." },
      { status: 400 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
