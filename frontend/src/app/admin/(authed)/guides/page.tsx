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
export const metadata = { title: "가이드 관리" };

type Row = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  published_at: string | null;
  evaluation_score: number | null;
  status: ContentStatus;
};

async function fetchRows(status: ContentStatus | "all"): Promise<Row[]> {
  const sb = getSupabaseAdmin();
  let q = sb
    .from("guides")
    .select("id, slug, title, category, difficulty, published_at, evaluation_score, status")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Row[];
}

type SearchParams = Promise<{ status?: string }>;

export default async function AdminGuidesPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">가이드</h1>
        <p className="mt-2 text-sm text-zinc-500">
          ai-service 의 <code className="font-mono text-xs">/guide-publish</code> 가 발행한 가이드.
          여기서는 수정 · 내리기 · 삭제만 한다.
        </p>
      </div>

      <div className="mt-6">
        <StatusFilter
          basePath="/admin/guides"
          current={status}
          options={CONTENT_STATUSES}
          labels={CONTENT_STATUS_LABEL}
        />
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500">
            표시할 가이드가 없습니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">발행일</th>
                  <th className="px-4 py-3 text-left font-semibold">제목</th>
                  <th className="px-4 py-3 text-left font-semibold">Slug</th>
                  <th className="px-4 py-3 text-left font-semibold">카테고리</th>
                  <th className="px-4 py-3 text-left font-semibold">난이도</th>
                  <th className="px-4 py-3 text-right font-semibold">평가</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                  <th className="px-4 py-3 text-right font-semibold">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                      {r.published_at ? r.published_at.slice(0, 10) : "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/admin/guides/${r.id}/edit`} className="hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">{r.slug}</td>
                    <td className="px-4 py-3 text-zinc-600">{r.category}</td>
                    <td className="px-4 py-3 text-zinc-600">{r.difficulty}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">
                      {r.evaluation_score == null ? "-" : r.evaluation_score.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/guides/${r.id}/edit`}
                        className="text-xs font-semibold text-zinc-500 hover:text-ink"
                      >
                        편집
                      </Link>
                    </td>
                  </tr>
                ))}
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
