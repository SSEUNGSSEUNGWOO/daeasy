import { NextResponse } from "next/server";

import { getCurrentCustomer, isAuthenticated } from "@/lib/customer-auth";
import { notifyInquiry } from "@/lib/notify";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  phone?: string | null;
  company?: string | null;
  course_slug?: string | null;
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // 문의는 로그인 필수 — UI 게이트만으로는 직접 POST 를 못 막는다
  if (!(await isAuthenticated())) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }

  const rl = await rateLimit("contact", getClientIp(req), 5, "1 m");
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

  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  if (!name || name.length > 100) {
    return NextResponse.json({ detail: "이름이 올바르지 않습니다." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ detail: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const phone = (payload.phone ?? "").trim().slice(0, 40);
  if (!phone) {
    return NextResponse.json({ detail: "연락처를 입력해주세요." }, { status: 400 });
  }
  const message = (payload.message ?? "").slice(0, 4000);
  const company = payload.company ? payload.company.trim().slice(0, 200) : null;
  const courseSlug = payload.course_slug ? payload.course_slug.slice(0, 120) : null;

  const sb = getSupabaseAdmin();

  // 문의를 계정에 연결한다. 위에서 로그인은 확인했지만 customer_profiles 가
  // 없는 세션(어드민 등)일 수 있어 null 허용 — 접수는 막지 않고 연결만 생략.
  const customer = await getCurrentCustomer().catch((err) => {
    console.error("[contact/inquiries] 고객 프로필 조회 실패 — 연결 없이 접수:", err);
    return null;
  });

  let courseId: string | null = null;
  if (courseSlug) {
    const { data: course } = await sb
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .limit(1)
      .maybeSingle();
    if (course) courseId = course.id as string;
  }

  const { data, error } = await sb
    .from("contact_inquiries")
    .insert({
      name,
      email,
      phone,
      company,
      course_id: courseId,
      message,
      user_id: customer?.id ?? null,
    })
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { detail: error?.message ?? "failed to create inquiry" },
      { status: 500 },
    );
  }

  // 관리자 메일 알림 — 실패해도 접수는 성공 (notify 내부 fail-open)
  await notifyInquiry({
    kind: "contact",
    fields: [
      ["이름", name],
      ["이메일", email],
      ["연락처", phone],
      ["회사/기관", company],
      ["관심 과정", courseSlug],
      ["문의 내용", message],
    ],
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
