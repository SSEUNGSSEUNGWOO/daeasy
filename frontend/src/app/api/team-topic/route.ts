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
};

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("team_topics")
    .select("*")
    .order("team_no");
  if (error) {
    console.error("[team-topic] 조회 실패:", error);
    return NextResponse.json({ detail: "현황을 불러오지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const rl = await rateLimit("team-topic", getClientIp(req), 10, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "요청이 많아 잠시 제출을 제한하고 있습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ detail: "제출 내용을 처리하지 못했습니다. 다시 제출해 주세요." }, { status: 400 });
  }

  const teamNo = Number(payload.team_no);
  if (!Number.isInteger(teamNo) || teamNo < 1 || teamNo > TEAM_COUNT) {
    return NextResponse.json({ detail: `1조부터 ${TEAM_COUNT}조 중에서 선택해 주세요.` }, { status: 400 });
  }
  const title = (payload.title ?? "").trim().slice(0, 100);
  if (!title) {
    return NextResponse.json({ detail: "주제를 입력해 주세요." }, { status: 400 });
  }
  const oneLiner = (payload.one_liner ?? "").trim().slice(0, 300);
  if (!oneLiner) {
    return NextResponse.json(
      { detail: "누구의 어떤 문제를 해결하는지 한 문장으로 입력해 주세요." },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("team_topics")
    .upsert(
      {
        team_no: teamNo,
        title,
        one_liner: oneLiner,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_no" },
    )
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error("[team-topic] 저장 실패:", error);
    return NextResponse.json(
      { detail: "주제를 제출하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
  return NextResponse.json(data);
}
