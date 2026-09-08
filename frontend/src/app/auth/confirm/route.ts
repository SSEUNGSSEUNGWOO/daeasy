import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { RESET_COOKIE, RESET_COOKIE_PATH, signResetCookie } from "@/lib/reset-cookie";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next");
  // "/" 로 시작하고 둘째 글자가 "/" 나 "\" 가 아닌 내부 경로만.
  // WHATWG URL 은 "/\evil.com" 을 "//evil.com" 으로 읽어 외부 호스트가 된다.
  const next = requestedNext && /^\/(?![/\\])/.test(requestedNext)
    ? requestedNext
    : "/mypage";
  const supabase = await createSupabaseServerClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing confirmation token") };

  if (result.error) {
    return NextResponse.redirect(new URL("/login?verification=failed", url.origin));
  }
  const res = NextResponse.redirect(new URL(next, url.origin));
  // 메일 링크를 통과한 세션만 현재 비밀번호 없이 새 비밀번호를 정할 수 있다.
  // 도난당한 일반 세션이 재설정 API 를 부르는 경로를 막는다 — 값은 이 사용자 id 로 서명 (lib/reset-cookie.ts)
  const userId = "data" in result ? result.data.user?.id : undefined;
  if (next === "/reset-password" && userId) {
    const { value, maxAge } = signResetCookie(userId);
    res.cookies.set(RESET_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: RESET_COOKIE_PATH,
      maxAge,
    });
  }
  return res;
}
