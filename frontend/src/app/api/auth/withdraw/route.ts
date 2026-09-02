import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/** 회원 탈퇴 — 개인정보는 파기하고 문의 기록은 연결만 끊고 보존한다.
 *  (개인정보 처리방침: 탈퇴 시 지체 없이 파기, 분쟁 처리 기록은 분리 보관) */
export async function POST(req: Request) {
  const rl = await rateLimitAuth("customer-withdraw", getClientIp(req), 3, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id: userId, email } = userData.user;

  let payload: { password?: string };
  try {
    payload = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }
  if (!payload.password) {
    return NextResponse.json({ detail: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  // 본인 확인 — 쿠키 세션을 건드리지 않는 일회용 클라이언트로 검증
  const bare = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { error: verifyError } = await bare.auth.signInWithPassword({
    email,
    password: payload.password,
  });
  if (verifyError) {
    return NextResponse.json({ detail: "비밀번호가 일치하지 않습니다." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // 1) 문의 기록은 보존하되 계정 연결만 끊는다 (user_id 에 FK 없음 — 명시적으로 끊는다)
  const unlink = await Promise.all([
    admin.from("contact_inquiries").update({ user_id: null }).eq("user_id", userId),
    admin.from("rental_inquiries").update({ user_id: null }).eq("user_id", userId),
  ]);
  const unlinkError = unlink.find((r) => r.error)?.error;
  if (unlinkError) {
    return NextResponse.json({ detail: unlinkError.message }, { status: 500 });
  }

  // 2) 개인정보 파기: 뉴스레터 구독 → 고객 프로필 → 계정 순
  const { error: nlError } = await admin
    .from("newsletter_subscribers")
    .delete()
    .eq("email", email);
  if (nlError) {
    return NextResponse.json({ detail: nlError.message }, { status: 500 });
  }
  const { error: profileError } = await admin
    .from("customer_profiles")
    .delete()
    .eq("id", userId);
  if (profileError) {
    return NextResponse.json({ detail: profileError.message }, { status: 500 });
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ detail: deleteError.message }, { status: 500 });
  }

  // 3) 이 브라우저의 세션 쿠키 정리 (계정은 이미 삭제됨 — 실패해도 무해)
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({ ok: true });
}
