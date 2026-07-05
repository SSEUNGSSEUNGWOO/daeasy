import { NextResponse } from "next/server";

import { isAdminAuthed } from "@/lib/admin-auth";
import { isContentStatus } from "@/lib/admin-content";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Payload = {
  slug?: string;
  title?: string;
  summary?: string;
  description?: string;
  client_name?: string | null;
  conducted_at?: string | null;
  course_id?: string | null;
  thumbnail_url?: string | null;
  status?: string;
};

function normalize(p: Payload): { row?: Record<string, unknown>; detail?: string } {
  const slug = (p.slug ?? "").trim();
  const title = (p.title ?? "").trim();
  if (!slug) return { detail: "slug 가 필요합니다." };
  if (!title) return { detail: "title 이 필요합니다." };
  if (!isContentStatus(p.status)) return { detail: "status 가 올바르지 않습니다." };

  return {
    row: {
      slug,
      title,
      summary: p.summary ?? "",
      description: p.description ?? "",
      client_name: p.client_name && p.client_name.trim() ? p.client_name : null,
      conducted_at: p.conducted_at && p.conducted_at.trim() ? p.conducted_at : null,
      course_id: p.course_id && p.course_id.trim() ? p.course_id : null,
      thumbnail_url: p.thumbnail_url && p.thumbnail_url.trim() ? p.thumbnail_url : null,
      status: p.status,
    },
  };
}

export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const { row, detail } = normalize(payload);
  if (!row) return NextResponse.json({ detail }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("cases")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ detail: error.message }, { status });
  }
  return NextResponse.json({ id: data.id });
}
