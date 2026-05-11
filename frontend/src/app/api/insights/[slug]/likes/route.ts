import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

type LikePayload = {
  user_fingerprint?: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const safe = decodeURIComponent(slug);
  const { count, error } = await supabase
    .from("insight_likes")
    .select("*", { count: "exact", head: true })
    .eq("slug", safe);
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ count: count ?? 0 });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const safe = decodeURIComponent(slug);

  const rl = await rateLimit("likes", getClientIp(req), 30, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "rate limited" }, { status: 429 });
  }

  let body: LikePayload | null = null;
  try {
    body = (await req.json()) as LikePayload;
  } catch {
    body = null;
  }
  const fingerprint = body?.user_fingerprint || crypto.randomUUID();

  const { error: insertError } = await supabase
    .from("insight_likes")
    .insert({ slug: safe, user_fingerprint: fingerprint });
  if (insertError) {
    return NextResponse.json({ detail: insertError.message }, { status: 500 });
  }

  const { count, error } = await supabase
    .from("insight_likes")
    .select("*", { count: "exact", head: true })
    .eq("slug", safe);
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ count: count ?? 0 });
}
