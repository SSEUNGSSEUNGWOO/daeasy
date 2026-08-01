"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABEL,
  type ContentStatus,
} from "@/lib/admin-content";

import { MarkdownEditor } from "../_components/markdown-editor";
import { ThumbnailPicker } from "../_components/thumbnail-picker";

export type InsightFormInitial = {
  slug: string;
  title: string;
  body: string;
  category: string;
  image_url: string | null;
  tags: string[];
  published_at: string;
  status: ContentStatus;
};

export function InsightForm({ initial }: { initial: InsightFormInitial }) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [category, setCategory] = useState(initial.category);
  const [imageUrl, setImageUrl] = useState(initial.image_url ?? "");
  const [tagsStr, setTagsStr] = useState(initial.tags.join(", "));
  const [publishedAt, setPublishedAt] = useState(initial.published_at);
  const [status, setStatus] = useState<ContentStatus>(initial.status);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      body,
      category: category.trim(),
      image_url: imageUrl.trim() || null,
      tags: tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published_at: publishedAt,
      status,
    };

    try {
      const res = await fetch(
        `/api/admin/insights/${encodeURIComponent(initial.slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(detail.detail ?? `실패 (${res.status})`);
      }
      router.push("/admin/insights");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "실패");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <Section title="기본 정보">
        <Field label="Slug (URL)" hint="ai-service 가 발행 시 정한 값. 좋아요·조회수가 이 값에 묶여 있어 수정하지 않는다.">
          <input
            type="text"
            value={initial.slug}
            readOnly
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-500"
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
        <Field label="태그" hint="쉼표로 구분">
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="LLM, 엔터프라이즈, 규제"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="본문">
        <MarkdownEditor value={body} onChange={setBody} />
      </Section>

      <Section title="커버 이미지">
        <ThumbnailPicker value={imageUrl} onChange={setImageUrl} />
      </Section>

      <Section title="발행">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <Field label="발행일" required>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            />
          </Field>
          <Field label="카테고리">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="daily_report"
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
          {submitting ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/insights")}
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
