import Link from "next/link";
import { notFound } from "next/navigation";

import { isContentStatus } from "@/lib/admin-content";
import { requireRole } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

import { GuideForm, type GuideFormInitial } from "../../guide-form";
import { DeleteButton } from "../../../courses/delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "가이드 편집" };

type Params = Promise<{ id: string }>;

async function fetchGuide(id: string): Promise<GuideFormInitial | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("guides")
    .select(
      "id, slug, title, summary, body, cover_url, category, difficulty, tags, published_at, status",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const publishedAt = data.published_at as string | null;

  return {
    id: data.id as string,
    slug: (data.slug as string) ?? "",
    title: (data.title as string) ?? "",
    summary: (data.summary as string) ?? "",
    body: (data.body as string) ?? "",
    cover_url: (data.cover_url as string | null) ?? null,
    category: (data.category as string) ?? "",
    difficulty: (data.difficulty as string) ?? "",
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    // timestamptz 를 date input 이 받는 YYYY-MM-DD 로 자른다
    published_at: publishedAt ? publishedAt.slice(0, 10) : "",
    status: isContentStatus(data.status) ? data.status : "draft",
  };
}

export default async function AdminGuideEditPage({ params }: { params: Params }) {
  await requireRole("admin");
  const { id } = await params;
  const guide = await fetchGuide(id);
  if (!guide) notFound();

  return (
    <section>
      <div className="flex items-baseline gap-3 text-sm text-zinc-500">
        <Link href="/admin/guides" className="hover:text-ink">
          가이드
        </Link>
        <span>›</span>
        <span className="text-ink">{guide.title || guide.slug}</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">가이드 편집</h1>

      <div className="mt-8">
        <GuideForm initial={guide} />
      </div>

      <div className="mt-16 border-t border-zinc-200 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
          위험 구역
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          공개만 내리려면 상태를 임시저장으로 바꾸세요. 삭제는 되돌릴 수 없습니다.
        </p>
        <div className="mt-4">
          <DeleteButton
            id={guide.id}
            endpoint="/api/admin/guides"
            redirectTo="/admin/guides"
          />
        </div>
      </div>
    </section>
  );
}
