"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/* 마이페이지 계정 관리 — 프로필 수정 / 비밀번호 변경 / 뉴스레터 구독.
   각 폼은 독립 제출이라 상태도 따로 둔다. */

const inputCls =
  "mt-2 w-full rounded-md border border-zinc-200 px-4 py-3 text-[15px] focus:border-ink focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-500";
const buttonCls =
  "rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover disabled:bg-zinc-400";

type Feedback = { type: "ok" | "error"; text: string } | null;

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      role={feedback.type === "error" ? "alert" : "status"}
      className={`text-[13px] ${feedback.type === "error" ? "text-red-600" : "text-emerald-700"}`}
    >
      {feedback.text}
    </p>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string; organization: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          organization: form.get("organization"),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) throw new Error(body.detail ?? "저장에 실패했습니다.");
      setFeedback({ type: "ok", text: "저장했습니다." });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "알 수 없는 오류" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-bold text-ink">이름</span>
          <input name="name" required maxLength={50} defaultValue={initial.name} disabled={submitting} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[13px] font-bold text-ink">이메일</span>
          {/* 이메일은 로그인 ID 라 여기서 못 바꾼다 */}
          <input value={initial.email} disabled readOnly className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[13px] font-bold text-ink">연락처</span>
          <input name="phone" required maxLength={40} defaultValue={initial.phone} disabled={submitting} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[13px] font-bold text-ink">소속</span>
          <input name="organization" maxLength={200} defaultValue={initial.organization} disabled={submitting} className={inputCls} />
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={submitting} className={buttonCls}>
          {submitting ? "저장 중..." : "프로필 저장"}
        </button>
        <FeedbackLine feedback={feedback} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    if (form.get("new_password") !== form.get("new_password_confirm")) {
      setFeedback({ type: "error", text: "새 비밀번호가 서로 일치하지 않습니다." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: form.get("current_password"),
          new_password: form.get("new_password"),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) throw new Error(body.detail ?? "변경에 실패했습니다.");
      formEl.reset();
      setFeedback({ type: "ok", text: "비밀번호를 변경했습니다." });
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "알 수 없는 오류" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <label className="block">
        <span className="text-[13px] font-bold text-ink">현재 비밀번호</span>
        <input name="current_password" type="password" autoComplete="current-password" required disabled={submitting} className={inputCls} />
      </label>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-bold text-ink">새 비밀번호</span>
          <input name="new_password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={submitting} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[13px] font-bold text-ink">새 비밀번호 확인</span>
          <input name="new_password_confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={submitting} className={inputCls} />
        </label>
      </div>
      <p className="text-[12.5px] leading-[1.7] text-zinc-500">
        8~128자, 영문 대·소문자, 숫자, 특수문자를 포함해야 합니다.
      </p>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={submitting} className={buttonCls}>
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </button>
        <FeedbackLine feedback={feedback} />
      </div>
    </form>
  );
}

export function NewsletterToggle({ initialSubscribed }: { initialSubscribed: boolean }) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function toggle() {
    setSubmitting(true);
    setFeedback(null);
    const nextValue = !subscribed;
    try {
      const res = await fetch("/api/auth/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: nextValue }),
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) throw new Error(body.detail ?? "변경에 실패했습니다.");
      setSubscribed(nextValue);
      setFeedback({ type: "ok", text: nextValue ? "구독을 시작했습니다." : "구독을 해지했습니다." });
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "알 수 없는 오류" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-zinc-200 px-5 py-4">
      <div>
        <p className="text-[14px] font-bold text-ink">AI·데이터 인사이트 뉴스레터</p>
        <p className="mt-1 text-[13px] text-zinc-500">
          {subscribed ? "구독 중입니다." : "구독하고 있지 않습니다."}
        </p>
        <FeedbackLine feedback={feedback} />
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={submitting}
        aria-pressed={subscribed}
        className={
          subscribed
            ? "rounded-md border border-zinc-300 px-5 py-2.5 text-[13px] font-bold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50"
            : "rounded-md bg-ink px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-ink-hover disabled:bg-zinc-400"
        }
      >
        {submitting ? "처리 중..." : subscribed ? "구독 해지" : "구독하기"}
      </button>
    </div>
  );
}
