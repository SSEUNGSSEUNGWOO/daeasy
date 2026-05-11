import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const safe = decodeURIComponent(slug);

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.rpc("increment_insight_view", {
    p_slug: safe,
  });
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  if (data === null || data === undefined) {
    return NextResponse.json(
      { detail: "insight not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ views: data });
}
