import { NextResponse } from "next/server";

import { isAdminAuthed } from "@/lib/admin-auth";
import { isContentStatus, isCourseLevel } from "@/lib/admin-content";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  slug?: string;
  title?: string;
  summary?: string;
  description?: string;
  level?: string;
  duration_hours?: number;
  price?: number | null;
  thumbnail_url?: string | null;
  status?: string;
  sort_order?: number;
};

function normalize(p: Payload): { row?: Record<string, unknown>; detail?: string } {
  const slug = (p.slug ?? "").trim();
  const title = (p.title ?? "").trim();
  if (!slug) return { detail: "slug 가 필요합니다." };
  if (!title) return { detail: "title 이 필요합니다." };
  if (!isCourseLevel(p.level)) return { detail: "level 이 올바르지 않습니다." };
  if (!isContentStatus(p.status)) return { detail: "status 가 올바르지 않습니다." };

  return {
    row: {
      slug,
      title,
      summary: p.summary ?? "",
      description: p.description ?? "",
      level: p.level,
      duration_hours: Math.max(0, Math.floor(Number(p.duration_hours) || 0)),
      price: p.price == null ? null : Math.max(0, Math.floor(Number(p.price))),
      thumbnail_url: p.thumbnail_url && p.thumbnail_url.trim() ? p.thumbnail_url : null,
      status: p.status,
      sort_order: Math.floor(Number(p.sort_order) || 0),
    },
  };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const { row, detail } = normalize(payload);
  if (!row) return NextResponse.json({ detail }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("courses")
    .update(row)
    .eq("id", id);
  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ detail: error.message }, { status });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const { error } = await getSupabaseAdmin()
    .from("courses")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
