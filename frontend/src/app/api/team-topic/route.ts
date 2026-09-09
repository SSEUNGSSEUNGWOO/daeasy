import { NextResponse } from "next/server";

import { TEAM_COUNT } from "@/app/team-topic/content";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  team_no?: number;
  title?: string;
  one_liner?: string;
  submitted_by?: string;
};

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("team_topics")
    .select("*")
    .order("team_no");
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const rl = await rateLimit("team-topic", getClientIp(req), 10, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }

  const teamNo = Number(payload.team_no);
  if (!Number.isInteger(teamNo) || teamNo < 1 || teamNo > TEAM_COUNT) {
    return NextResponse.json({ detail: "조를 선택해주세요." }, { status: 400 });
  }
  const title = (payload.title ?? "").trim().slice(0, 100);
  if (!title) {
    return NextResponse.json({ detail: "주제를 적어주세요." }, { status: 400 });
  }
  const oneLiner = (payload.one_liner ?? "").trim().slice(0, 300);
  if (!oneLiner) {
    return NextResponse.json(
      { detail: "누구의 어떤 문제를 푸는지 한 문장 적어주세요." },
      { status: 400 },
    );
  }
  const submittedBy = (payload.submitted_by ?? "").trim().slice(0, 50);
  if (!submittedBy) {
    return NextResponse.json({ detail: "제출자 이름을 적어주세요." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("team_topics")
    .upsert(
      {
        team_no: teamNo,
        title,
        one_liner: oneLiner,
        submitted_by: submittedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_no" },
    )
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { detail: error?.message ?? "저장에 실패했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json(data);
}
