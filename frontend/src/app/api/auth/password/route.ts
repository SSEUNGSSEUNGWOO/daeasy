import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// 가입과 동일 규칙 (signup/route.ts 의 PASSWORD_RE)
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

type Payload = { current_password?: string; new_password?: string };

export async function POST(req: Request) {
  const rl = await rateLimitAuth("customer-password", getClientIp(req), 5, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const current = payload.current_password ?? "";
  const next = payload.new_password ?? "";
  if (!current) {
    return NextResponse.json({ detail: "현재 비밀번호를 입력해주세요." }, { status: 400 });
  }
  if (!PASSWORD_RE.test(next)) {
    return NextResponse.json(
      { detail: "새 비밀번호는 8~128자이며 영문 대·소문자, 숫자, 특수문자를 포함해야 합니다." },
      { status: 400 },
    );
  }
  if (current === next) {
    return NextResponse.json(
      { detail: "새 비밀번호가 현재 비밀번호와 같습니다." },
      { status: 400 },
    );
  }

  // 현재 비밀번호 재확인 — 쿠키 세션을 건드리지 않는 일회용 클라이언트로 검증한다.
  // (자리 비운 사이 열린 세션으로 남이 비밀번호를 바꾸는 시나리오 차단)
  const bare = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { error: verifyError } = await bare.auth.signInWithPassword({
    email: userData.user.email,
    password: current,
  });
  if (verifyError) {
    return NextResponse.json(
      { detail: "현재 비밀번호가 일치하지 않습니다." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: next });
  if (updateError) {
    return NextResponse.json({ detail: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
