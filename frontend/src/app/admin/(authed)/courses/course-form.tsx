"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MarkdownEditor } from "../_components/markdown-editor";
import { ThumbnailPicker } from "../_components/thumbnail-picker";
import {
  COURSE_LEVELS,
  COURSE_LEVEL_LABEL,
  CONTENT_STATUSES,
  CONTENT_STATUS_LABEL,
  type ContentStatus,
  type CourseLevelValue,
} from "@/lib/admin-content";

export type CourseFormInitial = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: CourseLevelValue;
  duration_hours: number;
  price: number | null;
  thumbnail_url: string | null;
  status: ContentStatus;
  sort_order: number;
};

type Mode =
  | { kind: "new" }
  | { kind: "edit"; id: string };

type Props = {
  mode: Mode;
  initial?: CourseFormInitial;
};

const EMPTY: Omit<CourseFormInitial, "id"> = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  level: "beginner",
  duration_hours: 0,
  price: null,
  thumbnail_url: "",
  status: "draft",
  sort_order: 0,
};

export function CourseForm({ mode, initial }: Props) {
  const router = useRouter();
  const base: Omit<CourseFormInitial, "id"> = initial ?? EMPTY;

  const [slug, setSlug] = useState(base.slug);
  const [title, setTitle] = useState(base.title);
  const [summary, setSummary] = useState(base.summary);
  const [description, setDescription] = useState(base.description);
  const [level, setLevel] = useState<CourseLevelValue>(base.level);
  const [durationHours, setDurationHours] = useState<number>(base.duration_hours);
  const [priceStr, setPriceStr] = useState<string>(
    base.price == null ? "" : String(base.price),
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(base.thumbnail_url ?? "");
  const [status, setStatus] = useState<ContentStatus>(base.status);
  const [sortOrder, setSortOrder] = useState<number>(base.sort_order);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      summary,
      description,
      level,
      duration_hours: durationHours,
      price: priceStr.trim() === "" ? null : Number(priceStr),
      thumbnail_url: thumbnailUrl.trim() || null,
      status,
      sort_order: sortOrder,
    };

    try {
      const url =
        mode.kind === "new" ? "/api/admin/courses" : `/api/admin/courses/${mode.id}`;
      const method = mode.kind === "new" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `실패 (${res.status})`);
      }
      router.push("/admin/courses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "실패");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <Section title="기본 정보">
        <Field label="Slug (URL)" required>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            placeholder="ai-fundamentals"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
          />
        </Field>
        <Field label="제목" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
          />
        </Field>
        <Field label="요약 (한 줄 설명)">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="본문">
        <MarkdownEditor value={description} onChange={setDescription} />
      </Section>

      <Section title="분류 · 가격">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="레벨">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as CourseLevelValue)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            >
              {COURSE_LEVELS.map((v) => (
                <option key={v} value={v}>
                  {COURSE_LEVEL_LABEL[v]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="교육 시간 (h)">
            <input
              type="number"
              min={0}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            />
          </Field>
          <Field label="가격 (원)" hint="비워두면 '협의'">
            <input
              type="number"
              min={0}
              step={1000}
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="협의"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            />
          </Field>
        </div>
      </Section>

      <Section title="썸네일">
        <ThumbnailPicker value={thumbnailUrl} onChange={setThumbnailUrl} />
      </Section>

      <Section title="발행">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="상태">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            >
              {CONTENT_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {CONTENT_STATUS_LABEL[v]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="정렬 순서" hint="작을수록 위에 노출">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            />
          </Field>
        </div>
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[#0F0F0F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {submitting ? "저장 중..." : mode.kind === "new" ? "생성" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/courses")}
          className="rounded-md border border-zinc-200 px-6 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold text-[#0F0F0F]">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </label>
  );
}
