import { NextResponse } from "next/server";

import { getClientIp, rateLimitAuth } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
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
  marketingAgreed?: boolean;
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

  // 광고성 정보 수신은 개인정보 수집·이용 동의와 별개다. 체크한 사람만 등록한다.
  //
  // 동의 시점 기록을 먼저 하고 갱신된 행이 있을 때만 뉴스레터에 넣는다. 이미 가입된
  // 이메일로 재가입을 시도하면 Supabase 는 계정 존재를 숨기려고 에러 대신 임의 id 를
  // 가진 가짜 user 를 돌려주는데, 그 id 로는 update 가 0건이 된다. 이 순서가 아니면
  // 제3자가 기존 회원의 이메일로 가입을 시도해 그 사람의 해지된 구독을 되살릴 수 있다.
  //
  // 다만 이 가드는 **계정이 이미 있는 이메일**만 지킨다. 계정은 없고 뉴스레터만
  // 해지해둔 이메일이면 신규 가입이 성사돼 구독이 되살아난다. 같은 일이
  // /api/newsletter/subscribe 로 더 쉽게 되므로 실질 위험이 늘지는 않는다 —
  // 근본 해결은 그쪽에 이메일 확인(double opt-in)을 붙이는 별도 작업이다.
  //
  // 여기서 실패해도 가입은 성공으로 응답한다. auth.signUp() 이 이미 통과했으므로
  // 계정은 만들어진 상태이고, 4xx/5xx 를 돌려주면 사용자가 재시도해 중복 가입
  // 오류를 만난다. 실패는 함수 로그에만 남긴다.
  if (payload.marketingAgreed === true && data.user) {
    // getSupabaseAdmin() 은 SUPABASE_SERVICE_ROLE_KEY 가 없으면 throw 한다.
    // 여기서 터지면 계정은 이미 만들어졌는데 500 이 나가고, 사용자가 재시도하다
    // 중복 가입 오류를 만난다 — 바로 위 주석이 막으려던 실패다. 통째로 감싼다.
    try {
      const admin = getSupabaseAdmin();

      const { data: consented, error: consentError } = await admin
        .from("customer_profiles")
        .update({ marketing_agreed_at: new Date().toISOString() })
        .eq("id", data.user.id)
        .select("id");

      if (consentError) {
        console.error("마케팅 동의 시점 기록 실패:", consentError.message);
      } else if (consented && consented.length > 0) {
        const { error: newsletterError } = await admin
          .from("newsletter_subscribers")
          .upsert(
            { email, status: "active", unsubscribed_at: null, source: "signup" },
            { onConflict: "email" },
          );
        if (newsletterError) {
          console.error("가입 시 뉴스레터 등록 실패:", newsletterError.message);
        }
      }
    } catch (err) {
      console.error("가입 시 뉴스레터 처리 실패:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    requiresEmailVerification: !data.session,
  }, { status: 201 });
}
