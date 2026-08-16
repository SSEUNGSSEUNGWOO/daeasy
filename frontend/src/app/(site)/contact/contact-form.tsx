"use client";

import { useState } from "react";

import Link from "next/link";

type CourseOption = { slug: string; title: string };
type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm({
  courses,
  defaultCourseSlug = "",
}: {
  courses: CourseOption[];
  defaultCourseSlug?: string;
}) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(`/api/contact/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          company: (data.get("company") as string) || null,
          course_slug: (data.get("course_slug") as string) || null,
          message: data.get("message") ?? "",
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `요청 실패 (${res.status})`);
      }

      setState("success");
      form.reset();
    } catch (err) {
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "알 수 없는 오류");
    }
  }

  if (state === "success") {
    return (
      <div className="lg:col-span-7 rounded-3xl bg-zinc-50/70 p-10 ring-1 ring-zinc-100 sm:p-12">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          Submitted
        </p>
        <h3 className="mt-3 text-[24px] font-extrabold tracking-[-0.01em] text-ink">
          문의가 접수되었습니다.
        </h3>
        <p className="mt-4 text-[15px] leading-[1.8] text-zinc-700">
          담당자가 영업일 기준 1일 이내로 회신드립니다. 급하신 경우 070-5066-0995 로 연락해주세요.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-8 inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
        >
          새 문의 작성
        </button>
      </div>
    );
  }

  const submitting = state === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      className="lg:col-span-7 rounded-3xl bg-zinc-50/70 p-8 ring-1 ring-zinc-100 sm:p-10"
    >
      <fieldset disabled={submitting} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] font-bold text-ink">
              이름 <span className="text-red-500">*</span>
            </span>
            <input
              required
              name="name"
              type="text"
              placeholder="홍길동"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-bold text-ink">
              이메일 <span className="text-red-500">*</span>
            </span>
            <input
              required
              name="email"
              type="email"
              placeholder="name@company.com"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] font-bold text-ink">
              연락처 <span className="text-red-500">*</span>
            </span>
            <input
              required
              name="phone"
              type="tel"
              placeholder="010-0000-0000"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-bold text-ink">조직 / 부서</span>
            <input
              name="company"
              type="text"
              placeholder="회사명 또는 소속"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-[13px] font-bold text-ink">관심 과정</span>
          <select
            name="course_slug"
            defaultValue={defaultCourseSlug}
            className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100"
          >
            <option value="">전체 과정 / 미정</option>
            {courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[13px] font-bold text-ink">문의 내용</span>
          <textarea
            name="message"
            rows={6}
            placeholder="조직 규모, 도입 시기, 학습 목표, 궁금한 점 등을 자유롭게 적어주세요."
            className="mt-2 w-full resize-none rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-ink focus:outline-none disabled:bg-zinc-100"
          />
        </label>
        <label className="flex items-start gap-2.5">
          <input
            required
            name="privacy_consent"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-ink"
          />
          <span className="text-[13px] leading-[1.7] text-zinc-600">
            개인정보 수집·이용에 동의합니다. <span className="text-red-500">*</span>
            <span className="mt-0.5 block text-zinc-500">
              수집 항목(이름·이메일·연락처)은 문의 처리 목적으로만 이용하며, 보유 기간 등 자세한
              내용은{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                개인정보처리방침
              </Link>
              을 따릅니다.
            </span>
          </span>
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-6 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {submitting ? "전송 중..." : "문의 보내기"}
        </button>
        {state === "error" && (
          <p className="text-[13px] leading-[1.6] text-red-600">
            전송에 실패했습니다. 잠시 후 다시 시도하거나 070-5066-0995 로 연락해주세요.
            {errorMessage && <span className="mt-1 block text-zinc-500">({errorMessage})</span>}
          </p>
        )}
      </fieldset>
    </form>
  );
}
