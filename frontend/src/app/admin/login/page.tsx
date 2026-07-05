import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = { title: "어드민 로그인" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-sm">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          daeasy admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="mt-2 text-sm text-zinc-500">
          운영팀 전용 페이지입니다.
        </p>
        <Suspense fallback={<div className="mt-8 h-40" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
