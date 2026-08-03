import { NextResponse } from "next/server";

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
  return NextResponse.json({ id: data.id }, { status: 201 });
}
