"use client";

import { useState } from "react";

const TIME_SLOTS = [
  "전일 (09:00 ~ 18:00)",
  "오전 반일 (09:00 ~ 12:00)",
  "오후 반일 (13:00 ~ 18:00)",
  "기타",
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type FormState = "idle" | "submitting" | "success" | "error";

export function RentalForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const usageDate = (data.get("usage_date") as string) || null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rentals/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          usage_date: usageDate,
          time_slot: data.get("time_slot"),
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
        <h3 className="mt-3 text-[24px] font-extrabold tracking-[-0.01em] text-[#0F0F0F]">
          신청이 접수되었습니다.
        </h3>
        <p className="mt-4 text-[15px] leading-[1.8] text-zinc-700">
          담당자가 영업일 기준 1일 이내로 연락드립니다. 급하신 경우 070-5066-0995 로 전화해주세요.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-8 inline-flex items-center justify-center rounded-md bg-[#0F0F0F] px-6 py-3 text-[14px] font-bold text-white transition hover:bg-[#1a1a1a]"
        >
          새 신청 작성
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
            <span className="text-[13px] font-bold text-[#0F0F0F]">
              이름 <span className="text-red-500">*</span>
            </span>
            <input
              required
              name="name"
              type="text"
              placeholder="홍길동"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-[#0F0F0F] focus:outline-none disabled:bg-zinc-100"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-bold text-[#0F0F0F]">
              연락처 <span className="text-red-500">*</span>
            </span>
            <input
              required
              name="phone"
              type="tel"
              placeholder="010-0000-0000"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-[#0F0F0F] focus:outline-none disabled:bg-zinc-100"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] font-bold text-[#0F0F0F]">이용 날짜</span>
            <input
              name="usage_date"
              type="date"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-[#0F0F0F] focus:outline-none disabled:bg-zinc-100"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-bold text-[#0F0F0F]">이용 시간</span>
            <select
              name="time_slot"
              defaultValue={TIME_SLOTS[0]}
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-[#0F0F0F] focus:outline-none disabled:bg-zinc-100"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-[13px] font-bold text-[#0F0F0F]">내용</span>
          <textarea
            name="message"
            rows={5}
            placeholder="행사 목적, 인원, 필요 장비 등을 알려주세요."
            className="mt-2 w-full resize-none rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-[#0F0F0F] focus:outline-none disabled:bg-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-[#0F0F0F] px-6 py-4 text-[15px] font-bold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {submitting ? "신청 중..." : "신청하기"}
        </button>
        {state === "error" && (
          <p className="text-[13px] leading-[1.6] text-red-600">
            신청에 실패했습니다. 잠시 후 다시 시도하거나 070-5066-0995 로 연락해주세요.
            {errorMessage && <span className="mt-1 block text-zinc-500">({errorMessage})</span>}
          </p>
        )}
      </fieldset>
    </form>
  );
}
