"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const INPUT_CLASS = "mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100";

export function SignupForm() {
  // 인사이트 페이지 "뉴스레터 받기" 에서 온 경우 동의 체크를 미리 켠다
  const newsletterIntent = useSearchParams().get("newsletter") === "1";
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    window.dataeasyTurnstileSuccess = setCaptchaToken;
    window.dataeasyTurnstileExpired = () => setCaptchaToken("");
    return () => {
      delete window.dataeasyTurnstileSuccess;
      delete window.dataeasyTurnstileExpired;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      passwordConfirm: String(form.get("passwordConfirm") ?? ""),
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      organization: String(form.get("organization") ?? ""),
      privacyAgreed: form.get("privacyAgreed") === "on",
      marketingAgreed: form.get("marketingAgreed") === "on",
      captchaToken,
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as {
        detail?: string;
        requiresEmailVerification?: boolean;
      };
      if (!res.ok) throw new Error(body.detail ?? "회원가입에 실패했습니다.");

      router.push(body.requiresEmailVerification ? "/login?verification=sent" : "/mypage");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setCaptchaToken("");
      window.turnstile?.reset();
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      <Field label="이메일" name="email" type="email" autoComplete="email" maxLength={254} disabled={submitting} />
      <Field label="비밀번호" name="password" type="password" autoComplete="new-password" maxLength={128} disabled={submitting} />
      <p className="-mt-3 text-xs leading-5 text-zinc-500">8~128자, 영문 대·소문자, 숫자, 특수문자를 포함해주세요.</p>
      <Field label="비밀번호 확인" name="passwordConfirm" type="password" autoComplete="new-password" maxLength={128} disabled={submitting} />
      <Field label="이름" name="name" autoComplete="name" maxLength={50} disabled={submitting} />
      <Field label="연락처" name="phone" type="tel" autoComplete="tel" maxLength={20} disabled={submitting} />
      <Field label="소속" name="organization" autoComplete="organization" maxLength={100} disabled={submitting} />
      <label className="flex items-start gap-3 rounded-md border border-zinc-200 p-4 text-sm leading-6 text-zinc-700">
        <input name="privacyAgreed" type="checkbox" required disabled={submitting} className="mt-1 h-4 w-4 accent-black" />
        <span>
          <Link href="/privacy" target="_blank" className="font-bold text-ink underline underline-offset-2">개인정보 수집·이용 안내</Link>를 확인했으며 이에 동의합니다. <span className="text-accent">(필수)</span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-md border border-zinc-200 p-4 text-sm leading-6 text-zinc-700">
        <input name="marketingAgreed" type="checkbox" defaultChecked={newsletterIntent} disabled={submitting} className="mt-1 h-4 w-4 accent-black" />
        <span>
          교육 개설 소식과 뉴스레터를 이메일로 받겠습니다. <span className="text-zinc-500">(선택)</span>
        </span>
      </label>
      {captchaSiteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div
            className="cf-turnstile min-h-[65px]"
            data-sitekey={captchaSiteKey}
            data-callback="dataeasyTurnstileSuccess"
            data-expired-callback="dataeasyTurnstileExpired"
          />
        </>
      ) : process.env.NODE_ENV === "production" ? (
        <p role="alert" className="text-[13px] text-red-600">보안 확인 설정이 필요합니다.</p>
      ) : null}
      <button type="submit" disabled={submitting || (process.env.NODE_ENV === "production" && !captchaToken)} className="w-full rounded-md bg-ink px-6 py-3.5 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-zinc-400">
        {submitting ? "가입 중..." : "가입하기"}
      </button>
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <p className="text-center text-sm text-zinc-500">이미 계정이 있으신가요? <Link href="/login" className="font-bold text-ink hover:underline">로그인</Link></p>
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete, maxLength, disabled }: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  maxLength: number;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold text-ink">{label} <span className="text-accent" aria-hidden="true">*</span></span>
      <input name={name} type={type} autoComplete={autoComplete} maxLength={maxLength} required disabled={disabled} className={INPUT_CLASS} />
    </label>
  );
}

declare global {
  interface Window {
    dataeasyTurnstileSuccess?: (token: string) => void;
    dataeasyTurnstileExpired?: () => void;
    turnstile?: { reset: () => void };
  }
}
