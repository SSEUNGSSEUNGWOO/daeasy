import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";

import { ResetPasswordForm } from "./reset-form";

export const metadata = { title: "비밀번호 재설정", robots: { index: false } };
export const dynamic = "force-dynamic";

/** 재설정 메일 링크 → /auth/confirm 이 세션을 만든 뒤 여기로 온다.
 *  세션이 없으면(링크 만료·직접 접근) 다시 요청하게 보낸다. */
export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/forgot-password");

  return (
    <section className="mx-auto max-w-md px-6 py-16 sm:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">계정 복구</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">새 비밀번호 설정</h1>
      <p className="mt-4 text-[15px] leading-[1.7] text-zinc-600">{data.user.email} 계정의 비밀번호를 새로 정합니다.</p>
      <ResetPasswordForm />
    </section>
  );
}
