import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, unauthorized } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = { is_active?: boolean };

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { detail: "본인 계정은 비활성화할 수 없습니다." },
      { status: 400 },
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  if (typeof payload.is_active !== "boolean") {
    return NextResponse.json(
      { detail: "is_active 가 필요합니다." },
      { status: 400 },
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("profiles")
    .update({ is_active: payload.is_active })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
