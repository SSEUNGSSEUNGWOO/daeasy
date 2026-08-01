"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  INQUIRY_STATUSES,
  STATUS_LABEL,
  type InquiryStatus,
} from "@/lib/admin-inquiries";

export type RentalInquiryRow = {
  id: string;
  name: string;
  phone: string;
  usage_date: string | null;
  time_slot: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
};

export function RentalInquiriesTable({
  inquiries,
}: {
  inquiries: RentalInquiryRow[];
}) {
  if (inquiries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500">
        표시할 문의가 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">접수일</th>
            <th className="px-4 py-3 text-left font-semibold">이름</th>
            <th className="px-4 py-3 text-left font-semibold">연락처</th>
            <th className="px-4 py-3 text-left font-semibold">사용 희망</th>
            <th className="px-4 py-3 text-left font-semibold">상태</th>
            <th className="px-4 py-3" aria-label="펼치기" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {inquiries.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row }: { row: RentalInquiryRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<InquiryStatus>(row.status);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(next: InquiryStatus) {
    setStatus(next);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inquiries/rentals/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `실패 (${res.status})`);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus(row.status);
      setError(err instanceof Error ? err.message : "실패");
    }
  }

  const usage = [row.usage_date, row.time_slot].filter(Boolean).join(" · ") || "-";

  return (
    <>
      <tr className={pending ? "opacity-60" : undefined}>
        <td className="px-4 py-3 text-zinc-600">{formatDate(row.created_at)}</td>
        <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
        <td className="px-4 py-3 text-zinc-600">
          <a href={`tel:${row.phone}`} className="hover:underline">
            {row.phone}
          </a>
        </td>
        <td className="px-4 py-3 text-zinc-600">{usage}</td>
        <td className="px-4 py-3">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as InquiryStatus)}
            disabled={pending}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-ink focus:border-ink focus:outline-none"
          >
            {INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-semibold text-zinc-500 hover:text-ink"
          >
            {open ? "접기" : "자세히"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-zinc-50/60">
          <td colSpan={6} className="px-4 py-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Field label="사용 예정일" value={row.usage_date ?? "-"} />
              <Field label="시간대" value={row.time_slot ?? "-"} />
              <Field label="문의 ID" value={row.id} mono />
            </dl>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                문의 내용
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.7] text-zinc-800">
                {row.message || "(내용 없음)"}
              </p>
            </div>
            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 font-mono text-xs text-zinc-700"
            : "mt-1 text-sm text-zinc-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(d);
}
