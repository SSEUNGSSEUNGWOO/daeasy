import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, unauthorized } from "@/lib/admin-auth";
import { isInquiryStatus } from "@/lib/admin-inquiries";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = { status?: string };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { id } = await ctx.params;

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  if (!isInquiryStatus(payload.status)) {
    return NextResponse.json({ detail: "invalid status" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("rental_inquiries")
    .update({ status: payload.status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
