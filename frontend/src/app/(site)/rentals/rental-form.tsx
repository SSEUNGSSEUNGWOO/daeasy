"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { CONTACT_EMAIL } from "@/lib/site";
import { useCurrentCustomer } from "@/lib/use-current-customer";

const TIME_SLOTS = [
  "전일 (09:00 ~ 18:00)",
  "오전 반일 (09:00 ~ 12:00)",
  "오후 반일 (13:00 ~ 18:00)",
  "기타",
];

type FormState = "idle" | "submitting" | "success" | "error";

export function RentalForm() {
  const [state, setState] = useState<FormState>("idle");
  const customer = useCurrentCustomer();

  // 회원 정보가 도착하면 폼을 remount 해 defaultValue 를 반영한다 (입력이 uncontrolled 라
  // remount 없이는 안 채워진다). 다만 사용자가 이미 폼을 만지기 시작했다면 remount 하지
  // 않는다 — 입력값과 포커스가 통째로 날아가고, 모바일에선 키보드까지 내려가기 때문이다.
  // 그 경우 자동 채움을 포기한다. 어차피 직접 입력하던 중이라 잃는 게 없다.
  const [prefillKey, setPrefillKey] = useState("anon");
  const engaged = useRef(false);

  useEffect(() => {
    if (customer && !engaged.current) setPrefillKey(customer.email);
  }, [customer]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");

    const form = event.currentTarget;
    const data = new FormData(form);
    const usageDate = (data.get("usage_date") as string) || null;

    try {
      const res = await fetch(`/api/rentals/inquiries`, {
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
      // 서버 응답 원문은 사용자에게 노출하지 않는다 — 화면엔 고정 안내 문구만
      console.error("대관 신청 실패:", err);
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="lg:col-span-7 rounded-3xl bg-zinc-50/70 p-10 ring-1 ring-zinc-100 sm:p-12">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          접수 완료
        </p>
        <h3 className="mt-3 text-[24px] font-extrabold tracking-[-0.01em] text-ink">
          신청이 접수되었습니다.
        </h3>
        <p className="mt-4 text-[15px] leading-[1.8] text-zinc-700">
          담당자가 영업일 기준 1일 이내로 입력하신 연락처로 연락드립니다.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-8 inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
        >
          새 신청 작성
        </button>
      </div>
    );
  }

  const submitting = state === "submitting";

  return (
    <form
      key={prefillKey}
      onSubmit={handleSubmit}
      onFocusCapture={() => {
        engaged.current = true;
      }}
      className="lg:col-span-7 rounded-3xl bg-zinc-50/70 p-8 ring-1 ring-zinc-100 sm:p-10"
    >
      <fieldset disabled={submitting} className="space-y-6">
        {customer && (
          <p className="rounded-md bg-ink/5 px-4 py-3 text-[13px] leading-[1.7] text-zinc-700">
            <strong className="font-bold text-ink">{customer.name}님</strong>으로 신청합니다.
            접수 후{" "}
            <Link href="/mypage" className="font-bold text-ink underline underline-offset-2">
              마이페이지
            </Link>
            에서 진행 상황을 확인할 수 있습니다.
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] font-bold text-ink">
              이름 <span className="text-red-500">*</span>
            </span>
            <input
              required
              name="name"
              type="text"
              defaultValue={customer?.name ?? ""}
              placeholder="홍길동"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-bold text-ink">
              연락처 <span className="text-red-500">*</span>
            </span>
            <input
              required
              name="phone"
              type="tel"
              defaultValue={customer?.phone ?? ""}
              placeholder="010-0000-0000"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] font-bold text-ink">이용 날짜</span>
            <input
              name="usage_date"
              type="date"
              // 주말은 브라우저 기본 검증으로 막는다 — valueAsDate 는 UTC 자정이라 getUTCDay 로 본다
              onChange={(e) => {
                const d = e.currentTarget.valueAsDate;
                e.currentTarget.setCustomValidity(
                  d && [0, 6].includes(d.getUTCDay()) ? "주말은 대관이 어렵습니다. 평일 날짜를 선택해주세요." : "",
                );
              }}
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            />
            <span className="mt-1.5 block text-[12px] text-zinc-500">평일만 예약할 수 있습니다.</span>
          </label>
          <label className="block">
            <span className="text-[13px] font-bold text-ink">이용 시간</span>
            <select
              name="time_slot"
              defaultValue={TIME_SLOTS[0]}
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-800 focus:border-ink focus:outline-none disabled:bg-zinc-100"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-[13px] font-bold text-ink">내용</span>
          <textarea
            name="message"
            rows={5}
            placeholder="행사 목적, 인원, 필요 장비 등을 알려주세요."
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
              수집 항목(이름·연락처)은 대관 문의 처리 목적으로만 이용하며, 보유 기간 등 자세한
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
          {submitting ? "신청 중..." : "신청하기"}
        </button>
        {state === "error" && (
          <p className="text-[13px] leading-[1.6] text-red-600">
            신청에 실패했습니다. 잠시 후 다시 시도하시거나{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>{" "}
            로 보내주세요.
          </p>
        )}
      </fieldset>
    </form>
  );
}
