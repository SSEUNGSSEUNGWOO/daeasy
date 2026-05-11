import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다.",
  );
}

/** 공개 read 용. RLS 가 published 행만 노출. server / browser 모두 안전. */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

/**
 * service_role 권한 — RLS 우회. **서버에서만** 호출. Route Handler 안에서만.
 * env 가 없으면 에러 throw (실수 방지).
 */
export function getSupabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  }
  return createClient(SUPABASE_URL!, key, { auth: { persistSession: false } });
}
