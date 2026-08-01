import Link from "next/link";

import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABEL,
  isContentStatus,
  type ContentStatus,
} from "@/lib/admin-content";
import { requireRole } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

import { StatusFilter } from "../status-filter";

export const dynamic = "force-dynamic";
export const metadata = { title: "인사이트 관리" };

type Row = {
  slug: string;
  title: string;
  category: string;
  published_at: string;
  view_count: number;
  evaluation_score: number | null;
  status: ContentStatus;
};

async function fetchRows(status: ContentStatus | "all"): Promise<Row[]> {
  const sb = getSupabaseAdmin();
  let q = sb
    .from("insights")
    .select("slug, title, category, published_at, view_count, evaluation_score, status")
    .order("published_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Row[];
}

type SearchParams = Promise<{ status?: string }>;

export default async function AdminInsightsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const status: ContentStatus | "all" = isContentStatus(params.status)
    ? params.status
    : "all";
  const rows = await fetchRows(status);

  return (
    <section>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">인사이트</h1>
        <p className="mt-2 text-sm text-zinc-500">
          ai-service 의 <code className="font-mono text-xs">/insight-publish</code> 가 발행한 동향 리포트.
          신규 작성은 파이프라인이 담당하고, 여기서는 수정 · 내리기 · 삭제만 한다.
        </p>
      </div>

      <div className="mt-6">
        <StatusFilter
          basePath="/admin/insights"
          current={status}
          options={CONTENT_STATUSES}
          labels={CONTENT_STATUS_LABEL}
        />
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500">
            표시할 인사이트가 없습니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">발행일</th>
                  <th className="px-4 py-3 text-left font-semibold">제목</th>
                  <th className="px-4 py-3 text-left font-semibold">카테고리</th>
                  <th className="px-4 py-3 text-right font-semibold">조회</th>
                  <th className="px-4 py-3 text-right font-semibold">평가</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                  <th className="px-4 py-3 text-right font-semibold">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => {
                  const href = `/admin/insights/${encodeURIComponent(r.slug)}/edit`;
                  return (
                    <tr key={r.slug}>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                        {r.published_at}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">
                        <Link href={href} className="hover:underline">
                          {r.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{r.category}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">
                        {(r.view_count ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600">
                        {r.evaluation_score == null ? "-" : r.evaluation_score.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={href}
                          className="text-xs font-semibold text-zinc-500 hover:text-ink"
                        >
                          편집
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const cls =
    status === "published"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-zinc-100 text-zinc-600";
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>
      {CONTENT_STATUS_LABEL[status]}
    </span>
  );
}
