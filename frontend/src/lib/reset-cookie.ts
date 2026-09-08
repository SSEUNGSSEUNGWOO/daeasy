import { createHmac, timingSafeEqual } from "node:crypto";

/** 비밀번호 재설정 메일 링크를 실제로 통과한 세션만 /api/auth/reset-password 를 쓸 수 있게 하는 쿠키.
 *  /auth/confirm 이 심고 reset-password 가 검사한다 (route.ts 는 HTTP 메서드 외 export 가 금지라 여기서 공유).
 *
 *  값이 그냥 "1" 이면 훔친 일반 세션에 Cookie 헤더만 손으로 붙여도 통과해, 현재 비밀번호 확인 없이
 *  비밀번호를 바꾸는 유일한 경로가 된다. 그래서 user id + 만료 시각을 서명한다.
 *  키는 Vercel 에 이미 있는 service role 키 — 그게 새면 어차피 전부 끝이라 보안 경계가 늘지 않는다. */
export const RESET_COOKIE = "pw-reset";
export const RESET_COOKIE_PATH = "/api/auth/reset-password";
const TTL_SEC = 600;

function mac(userId: string, exp: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY 미설정");
  return createHmac("sha256", secret).update(`${userId}.${exp}`).digest("hex");
}

export function signResetCookie(userId: string): { value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  return { value: `${exp}.${mac(userId, exp)}`, maxAge: TTL_SEC };
}

export function verifyResetCookie(value: string | undefined, userId: string): boolean {
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000 || !sig) return false;
  const expected = mac(userId, exp);
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
