import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// 가입과 동일 규칙 (signup/route.ts 의 PASSWORD_RE)
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

// /auth/confirm 이 재설정 링크를 통과시킬 때 심는 쿠키 (이름·경로 그쪽과 동일)
const RESET_COOKIE = "pw-reset";
const RESET_COOKIE_PATH = "/api/auth/reset-password";

/** 재설정 메일 링크로 들어온 세션에서 새 비밀번호 저장.
 *  현재 비밀번호 재확인이 없는 대신, 메일 링크를 실제로 통과했다는 쿠키를 요구한다 —
 *  이게 없으면 도난당한 일반 세션이 /api/auth/password 의 재확인을 우회하는 통로가 된다. */
export async function POST(req: Request) {
  const rl = await rateLimitAuth("customer-reset", getClientIp(req), 5, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const store = await cookies();
  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user || store.get(RESET_COOKIE)?.value !== "1") {
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
  // 일회용 — 성공하면 바로 지운다
  const res = NextResponse.json({ ok: true });
  res.cookies.set(RESET_COOKIE, "", { path: RESET_COOKIE_PATH, maxAge: 0 });
  return res;
}
