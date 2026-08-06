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
