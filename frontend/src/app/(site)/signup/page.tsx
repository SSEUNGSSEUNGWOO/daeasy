import { SignupForm } from "./signup-form";

export const metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-lg px-6 py-16 sm:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">Join daeasy</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">회원가입</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-500">데이지의 교육과 AI·데이터 소식을 더 편리하게 만나보세요.</p>
      <SignupForm />
    </section>
  );
}
