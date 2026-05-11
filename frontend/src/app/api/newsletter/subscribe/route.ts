import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = { email?: string };

export async function POST(req: Request) {
  const rl = await rateLimit("newsletter", getClientIp(req), 5, "1 m");
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
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { detail: "이메일 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  // 기존 backend 와 동일 — 실제 newsletter_subscribers 저장 로직은 추후 구현.
  return NextResponse.json({ status: "pending" });
}
