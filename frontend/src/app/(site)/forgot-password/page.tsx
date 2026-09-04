import { ForgotPasswordForm } from "./forgot-form";

export const metadata = { title: "비밀번호 찾기", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto max-w-md px-6 py-16 sm:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">계정 복구</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">비밀번호 찾기</h1>
      <p className="mt-4 text-[15px] leading-[1.7] text-zinc-600">
        가입한 이메일을 입력하면 비밀번호를 다시 설정할 수 있는 링크를 보내드립니다.
      </p>
      <ForgotPasswordForm />
    </section>
  );
}
