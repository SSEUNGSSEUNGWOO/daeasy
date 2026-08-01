import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentUser, unauthorized } from "@/lib/admin-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const BUCKET = "content-images";

function extFor(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return unauthorized();

  const rl = await rateLimit("admin-upload", getClientIp(req), 60, "1 m");
  if (!rl.success) {
    return NextResponse.json({ detail: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ detail: "multipart form 필요" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "file 필드가 필요합니다." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { detail: `허용되지 않은 형식입니다. (${file.type})` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { detail: `파일이 너무 큽니다. (${(file.size / 1024 / 1024).toFixed(1)}MB, 최대 10MB)` },
      { status: 413 },
    );
  }

  const path = `${randomUUID()}.${extFor(file.type)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const sb = getSupabaseAdmin();
  const up = await sb.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (up.error) {
    return NextResponse.json({ detail: up.error.message }, { status: 500 });
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
