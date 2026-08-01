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

export type GuideFormInitial = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  cover_url: string | null;
  category: string;
  difficulty: string;
  tags: string[];
  published_at: string;
  status: ContentStatus;
};

export function GuideForm({ initial }: { initial: GuideFormInitial }) {
  const router = useRouter();

  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [summary, setSummary] = useState(initial.summary);
  const [body, setBody] = useState(initial.body);
  const [coverUrl, setCoverUrl] = useState(initial.cover_url ?? "");
  const [category, setCategory] = useState(initial.category);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
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
      slug: slug.trim(),
      title: title.trim(),
      summary,
      body,
      cover_url: coverUrl.trim() || null,
      category: category.trim(),
      difficulty: difficulty.trim(),
      tags: tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published_at: publishedAt || null,
      status,
    };

    try {
      const res = await fetch(`/api/admin/guides/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(detail.detail ?? `실패 (${res.status})`);
      }
      router.push("/admin/guides");
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
        <Field label="태그" hint="쉼표로 구분">
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="본문">
        <MarkdownEditor value={body} onChange={setBody} />
      </Section>

      <Section title="커버 이미지">
        <ThumbnailPicker value={coverUrl} onChange={setCoverUrl} />
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
          <Field label="발행일" hint="비워두면 목록 정렬에서 맨 뒤로 갑니다">
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            />
          </Field>
          <Field label="카테고리" hint="AI 기초 / 실무 활용 / 기술 심화 등">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            />
          </Field>
          <Field label="난이도" hint="입문 / 기초 / 심화">
            <input
              type="text"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
            />
          </Field>
        </div>
        <p className="text-xs text-zinc-500">
          TL;DR · 영상 · 이미지 목록은 ai-service 가 채우는 항목이라 여기서 편집하지 않으며, 저장해도 그대로 유지됩니다.
        </p>
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
          onClick={() => router.push("/admin/guides")}
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
