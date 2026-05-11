import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = { email?: string };

export async function POST(req: Request) {
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
