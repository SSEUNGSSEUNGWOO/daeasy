import Link from "next/link";

import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABEL,
  COURSE_LEVEL_LABEL,
  isContentStatus,
  type ContentStatus,
  type CourseLevelValue,
} from "@/lib/admin-content";
import { getSupabaseAdmin } from "@/lib/supabase";

import { StatusFilter } from "../status-filter";

export const dynamic = "force-dynamic";
export const metadata = { title: "교육과정 관리" };

type Row = {
  id: string;
  slug: string;
  title: string;
  level: CourseLevelValue;
  duration_hours: number;
  price: number | null;
  status: ContentStatus;
  sort_order: number;
  updated_at: string;
};

async function fetchRows(status: ContentStatus | "all"): Promise<Row[]> {
  const sb = getSupabaseAdmin();
  let q = sb
    .from("courses")
    .select("id, slug, title, level, duration_hours, price, status, sort_order, updated_at")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Row[];
}

type SearchParams = Promise<{ status?: string }>;

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status: ContentStatus | "all" = isContentStatus(params.status)
    ? params.status
    : "all";
  const rows = await fetchRows(status);

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">교육과정</h1>
          <p className="mt-2 text-sm text-zinc-500">
            /courses 에 노출되는 교육과정 목록. sort_order 오름차순.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-hover"
        >
          + 신규
        </Link>
      </div>

      <div className="mt-6">
        <StatusFilter
          basePath="/admin/courses"
          current={status}
          options={CONTENT_STATUSES}
          labels={CONTENT_STATUS_LABEL}
        />
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500">
            표시할 교육과정이 없습니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">정렬</th>
                  <th className="px-4 py-3 text-left font-semibold">제목</th>
                  <th className="px-4 py-3 text-left font-semibold">Slug</th>
                  <th className="px-4 py-3 text-left font-semibold">레벨</th>
                  <th className="px-4 py-3 text-left font-semibold">시간</th>
                  <th className="px-4 py-3 text-left font-semibold">가격</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                  <th className="px-4 py-3 text-right font-semibold">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-zinc-500">{r.sort_order}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/admin/courses/${r.id}/edit`} className="hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">{r.slug}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {COURSE_LEVEL_LABEL[r.level] ?? r.level}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{r.duration_hours}h</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {r.price == null ? "협의" : `${r.price.toLocaleString()}원`}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/courses/${r.id}/edit`}
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
