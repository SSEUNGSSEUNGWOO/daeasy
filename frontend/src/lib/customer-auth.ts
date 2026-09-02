import "server-only";

import { cache } from "react";

import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  organization: string;
};

/** 로그인 여부만 확인 (어드민 세션도 로그인으로 인정 — 게이트 통과 기준은
 * "인증된 사용자"이지 customer_profiles 존재 여부가 아니다). */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return !error && !!data.user;
});

export const getCurrentCustomer = cache(async (): Promise<Customer | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await getSupabaseAdmin()
    .from("customer_profiles")
    .select("id,email,name,phone,organization")
    .eq("id", data.user.id)
    .maybeSingle<Customer>();

  return profile ?? null;
});
