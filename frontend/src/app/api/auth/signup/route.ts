import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type Payload = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  phone?: string;
  organization?: string;
  privacyAgreed?: boolean;
  captchaToken?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body, cache: "no-store" },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimitAuth("customer-signup", ip, 5, "1 h");
  if (!rl.success) {
    return NextResponse.json(
      { detail: "현재 가입 요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const password = payload.password ?? "";
  const name = (payload.name ?? "").trim();
  const phone = (payload.phone ?? "").trim();
  const organization = (payload.organization ?? "").trim();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ detail: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!PASSWORD_RE.test(password)) {
    return NextResponse.json(
      { detail: "비밀번호는 8~128자이며 영문 대·소문자, 숫자, 특수문자를 포함해야 합니다." },
      { status: 400 },
    );
  }
  if (password !== payload.passwordConfirm) {
    return NextResponse.json({ detail: "비밀번호가 일치하지 않습니다." }, { status: 400 });
  }
  if (name.length < 1 || name.length > 50) {
    return NextResponse.json({ detail: "이름은 50자 이내로 입력해주세요." }, { status: 400 });
  }
  if (phone.length < 1 || phone.length > 20) {
    return NextResponse.json({ detail: "연락처는 20자 이내로 입력해주세요." }, { status: 400 });
  }
  if (organization.length < 1 || organization.length > 100) {
    return NextResponse.json({ detail: "소속은 100자 이내로 입력해주세요." }, { status: 400 });
  }
  if (payload.privacyAgreed !== true) {
    return NextResponse.json({ detail: "개인정보 수집·이용에 동의해주세요." }, { status: 400 });
  }
  if (!(await verifyCaptcha(payload.captchaToken ?? "", ip))) {
    return NextResponse.json({ detail: "보안 확인에 실패했습니다. 다시 시도해주세요." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl && process.env.NODE_ENV === "production") {
    return NextResponse.json({ detail: "회원가입 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl ?? new URL(req.url).origin}/auth/confirm?next=/mypage`,
      data: { account_type: "customer", name, phone, organization },
    },
  });

  if (error) {
    return NextResponse.json({ detail: "회원가입 요청을 처리하지 못했습니다." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    requiresEmailVerification: !data.session,
  }, { status: 201 });
}
