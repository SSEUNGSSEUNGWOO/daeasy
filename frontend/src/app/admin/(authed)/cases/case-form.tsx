"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MarkdownEditor } from "../_components/markdown-editor";
import { ThumbnailPicker } from "../_components/thumbnail-picker";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABEL,
  type ContentStatus,
} from "@/lib/admin-content";

export type CaseFormInitial = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  client_name: string | null;
  conducted_at: string | null; // YYYY-MM-DD
  course_id: string | null;
  thumbnail_url: string | null;
  status: ContentStatus;
};

export type CourseOption = { id: string; title: string };

type Mode =
  | { kind: "new" }
  | { kind: "edit"; id: string };

type Props = {
  mode: Mode;
  initial?: CaseFormInitial;
  courses: CourseOption[];
};

const EMPTY: Omit<CaseFormInitial, "id"> = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  client_name: "",
  conducted_at: "",
  course_id: null,
  thumbnail_url: "",
  status: "draft",
};

export function CaseForm({ mode, initial, courses }: Props) {
  const router = useRouter();
  const base: Omit<CaseFormInitial, "id"> = initial ?? EMPTY;

  const [slug, setSlug] = useState(base.slug);
  const [title, setTitle] = useState(base.title);
  const [summary, setSummary] = useState(base.summary);
  const [description, setDescription] = useState(base.description);
  const [clientName, setClientName] = useState<string>(base.client_name ?? "");
  const [conductedAt, setConductedAt] = useState<string>(base.conducted_at ?? "");
  const [courseId, setCourseId] = useState<string>(base.course_id ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(base.thumbnail_url ?? "");
  const [status, setStatus] = useState<ContentStatus>(base.status);

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
      client_name: clientName.trim() || null,
      conducted_at: conductedAt || null,
      course_id: courseId || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      status,
    };

    try {
      const url =
        mode.kind === "new" ? "/api/admin/cases" : `/api/admin/cases/${mode.id}`;
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
      router.push("/admin/cases");
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
            placeholder="samsung-ai-workshop-2026"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-800 focus:border-ink focus:outline-none"
          />
        </Field>
        <Field label="제목" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-ink focus:outline-none"
          />
        </Field>
        <Field label="요약">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-ink focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="본문">
        <MarkdownEditor value={description} onChange={setDescription} />
      </Section>

      <Section title="사례 정보">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="고객사">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="예: 삼성전자"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-ink focus:outline-none"
            />
          </Field>
          <Field label="실시일">
            <input
              type="date"
              value={conductedAt}
              onChange={(e) => setConductedAt(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-ink focus:outline-none"
            />
          </Field>
          <Field label="관련 교육과정">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-ink focus:outline-none"
            >
              <option value="">(연결 없음)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="썸네일">
        <ThumbnailPicker value={thumbnailUrl} onChange={setThumbnailUrl} />
      </Section>

      <Section title="발행">
        <Field label="상태">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentStatus)}
            className="w-64 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-ink focus:outline-none"
          >
            {CONTENT_STATUSES.map((v) => (
              <option key={v} value={v}>
                {CONTENT_STATUS_LABEL[v]}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {submitting ? "저장 중..." : mode.kind === "new" ? "생성" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cases")}
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
      <span className="text-[13px] font-bold text-ink">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </label>
  );
}
