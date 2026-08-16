import { Suspense } from "react";

import { CustomerLoginForm } from "./login-form";

export const metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md px-6 py-16 sm:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">환영합니다</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">로그인</h1>
      <Suspense fallback={<div className="mt-10 h-64" />}>
        <CustomerLoginForm />
      </Suspense>
    </section>
  );
}
