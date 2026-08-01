import { NextResponse } from "next/server";

import { isAdminAuthed } from "@/lib/admin-auth";
import { isContentStatus } from "@/lib/admin-content";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  slug?: string;
  title?: string;
  summary?: string;
  body?: string;
  cover_url?: string | null;
  category?: string;
  difficulty?: string;
  tags?: unknown;
  published_at?: string | null;
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

/** tldr / videos / images 는 ai-service 가 채우는 jsonb 라 어드민 편집 대상에서 제외한다 (미포함 = 보존). */
function normalize(p: Payload): { row?: Record<string, unknown>; detail?: string } {
  const slug = (p.slug ?? "").trim();
  const title = (p.title ?? "").trim();
  if (!slug) return { detail: "slug 가 필요합니다." };
  if (!title) return { detail: "title 이 필요합니다." };
  if (!isContentStatus(p.status)) return { detail: "status 가 올바르지 않습니다." };
  if (p.published_at && !DATE_RE.test(p.published_at)) {
    return { detail: "published_at 은 YYYY-MM-DD 형식이어야 합니다." };
  }

  return {
    row: {
      slug,
      title,
      summary: p.summary ?? "",
      body: p.body ?? "",
      cover_url: p.cover_url && p.cover_url.trim() ? p.cover_url.trim() : null,
      category: (p.category ?? "").trim(),
      difficulty: (p.difficulty ?? "").trim(),
      tags: normalizeTags(p.tags),
      published_at: p.published_at ? p.published_at : null,
      status: p.status,
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

  const { error } = await getSupabaseAdmin().from("guides").update(row).eq("id", id);
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

  const { error } = await getSupabaseAdmin().from("guides").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
