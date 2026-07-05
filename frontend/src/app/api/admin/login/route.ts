import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  makeCookieValue,
  verifyPassword,
} from "@/lib/admin-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Payload = { password?: string };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

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

  const password = (payload.password ?? "").trim();
  if (!password) {
    return NextResponse.json({ detail: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ detail: "비밀번호가 일치하지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, makeCookieValue(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
