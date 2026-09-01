import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

type LikePayload = {
  user_fingerprint?: string | null;
  /** 연타를 클라이언트가 모아 보낸 횟수. 요청 수를 줄여 rate limit 에 걸리지 않게 한다 */
  presses?: number;
};

/**
 * 한 요청으로 올릴 수 있는 최대 좋아요 수.
 * 배치는 요청 수(=함수 호출)를 줄이지만 요청당 행 수를 늘리므로,
 * IP당 요청 상한을 30 → 10 으로 함께 낮춰 총 유입을 통제한다.
 */
const MAX_PRESSES = 10;

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

  const rl = await rateLimit("likes", getClientIp(req), 10, "1 m");
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
  const presses = Math.min(
    MAX_PRESSES,
    Math.max(1, Math.floor(Number(body?.presses) || 1)),
  );

  const { error: insertError } = await supabase
    .from("insight_likes")
    .insert(
      Array.from({ length: presses }, () => ({
        slug: safe,
        user_fingerprint: fingerprint,
      })),
    );
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
