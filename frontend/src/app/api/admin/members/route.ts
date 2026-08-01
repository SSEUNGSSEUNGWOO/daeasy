import { NextResponse } from "next/server";

import {
  forbidden,
  getCurrentUser,
  isAdminRole,
  unauthorized,
} from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  email?: string;
  name?: string;
  role?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const name = (payload.name ?? "").trim();
  const password = payload.password ?? "";
  const role = payload.role;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { detail: "이메일 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { detail: "비밀번호는 8자 이상이어야 합니다." },
      { status: 400 },
    );
  }
  if (!isAdminRole(role)) {
    return NextResponse.json({ detail: "role 이 올바르지 않습니다." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // 메일 발송 경로가 없으므로 이메일 확인을 건너뛴다.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { detail: error?.message ?? "계정 생성에 실패했습니다." },
      { status: 400 },
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    email,
    name,
    role,
  });

  if (profileError) {
    // 프로필이 없으면 로그인해도 아무것도 못 하는 유령 계정이 된다. 되돌린다.
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ detail: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
