import { NextResponse } from "next/server";

import { isAdminAuthed } from "@/lib/admin-auth";
import { isContentStatus } from "@/lib/admin-content";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  title?: string;
  body?: string;
  category?: string;
  image_url?: string | null;
  tags?: unknown;
  published_at?: string;
  status?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const tag = raw.trim();
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out;
}

function normalize(p: Payload): { row?: Record<string, unknown>; detail?: string } {
  const title = (p.title ?? "").trim();
  if (!title) return { detail: "title 이 필요합니다." };
  if (!isContentStatus(p.status)) return { detail: "status 가 올바르지 않습니다." };
  if (!p.published_at || !DATE_RE.test(p.published_at)) {
    return { detail: "published_at 은 YYYY-MM-DD 형식이어야 합니다." };
  }

  return {
    row: {
      title,
      body: p.body ?? "",
      category: (p.category ?? "").trim() || "general",
      image_url: p.image_url && p.image_url.trim() ? p.image_url.trim() : null,
      tags: normalizeTags(p.tags),
      published_at: p.published_at,
      status: p.status,
    },
  };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const { row, detail } = normalize(payload);
  if (!row) return NextResponse.json({ detail }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("insights")
    .update(row)
    .eq("slug", decodeURIComponent(slug));
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;

  // insight_likes 는 slug FK on delete cascade 라 함께 정리된다
  const { error } = await getSupabaseAdmin()
    .from("insights")
    .delete()
    .eq("slug", decodeURIComponent(slug));
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
