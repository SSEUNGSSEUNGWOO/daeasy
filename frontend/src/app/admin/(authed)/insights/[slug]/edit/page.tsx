import Link from "next/link";
import { notFound } from "next/navigation";

import { isContentStatus } from "@/lib/admin-content";
import { getSupabaseAdmin } from "@/lib/supabase";

import { InsightForm, type InsightFormInitial } from "../../insight-form";
import { DeleteButton } from "../../../courses/delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "인사이트 편집" };

type Params = Promise<{ slug: string }>;

async function fetchInsight(slug: string): Promise<InsightFormInitial | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("insights")
    .select("slug, title, body, category, image_url, tags, published_at, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    slug: data.slug as string,
    title: (data.title as string) ?? "",
    body: (data.body as string) ?? "",
    category: (data.category as string) ?? "",
    image_url: (data.image_url as string | null) ?? null,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    published_at: (data.published_at as string) ?? "",
    status: isContentStatus(data.status) ? data.status : "published",
  };
}

export default async function AdminInsightEditPage({ params }: { params: Params }) {
  const { slug } = await params;
  // slug 에 한글이 들어가고 params 의 인코딩 상태가 경로마다 다를 수 있어 정규화한다
  const decoded = decodeURIComponent(slug);
  const insight = await fetchInsight(decoded);
  if (!insight) notFound();

  return (
    <section>
      <div className="flex items-baseline gap-3 text-sm text-zinc-500">
        <Link href="/admin/insights" className="hover:text-[#0F0F0F]">
          인사이트
        </Link>
        <span>›</span>
        <span className="text-[#0F0F0F]">{insight.title || insight.slug}</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">인사이트 편집</h1>

      <div className="mt-8">
        <InsightForm initial={insight} />
      </div>

      <div className="mt-16 border-t border-zinc-200 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
          위험 구역
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          삭제하면 이 인사이트의 좋아요 기록도 함께 지워집니다 (FK on delete cascade).
          공개만 내리려면 상태를 임시저장으로 바꾸세요.
        </p>
        <div className="mt-4">
          <DeleteButton
            id={encodeURIComponent(insight.slug)}
            endpoint="/api/admin/insights"
            redirectTo="/admin/insights"
          />
        </div>
      </div>
    </section>
  );
}
