import Link from "next/link";
import { notFound } from "next/navigation";

import { getSupabaseAdmin } from "@/lib/supabase";
import { isContentStatus } from "@/lib/admin-content";

import { CaseForm, type CaseFormInitial, type CourseOption } from "../../case-form";
import { DeleteButton } from "../../../courses/delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "교육 사례 편집" };

type Params = Promise<{ id: string }>;

async function fetchCase(id: string): Promise<CaseFormInitial | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("cases")
    .select(
      "id, slug, title, summary, description, client_name, conducted_at, course_id, thumbnail_url, status",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const status = isContentStatus(data.status) ? data.status : "draft";

  return {
    id: data.id as string,
    slug: (data.slug as string) ?? "",
    title: (data.title as string) ?? "",
    summary: (data.summary as string) ?? "",
    description: (data.description as string) ?? "",
    client_name: (data.client_name as string | null) ?? null,
    conducted_at: (data.conducted_at as string | null) ?? null,
    course_id: (data.course_id as string | null) ?? null,
    thumbnail_url: (data.thumbnail_url as string | null) ?? null,
    status,
  };
}

async function fetchCourses(): Promise<CourseOption[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("courses")
    .select("id, title")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CourseOption[];
}

export default async function AdminCaseEditPage({ params }: { params: Params }) {
  const { id } = await params;
  const [row, courses] = await Promise.all([fetchCase(id), fetchCourses()]);
  if (!row) notFound();

  return (
    <section>
      <div className="flex items-baseline gap-3 text-sm text-zinc-500">
        <Link href="/admin/cases" className="hover:text-[#0F0F0F]">
          교육 사례
        </Link>
        <span>›</span>
        <span className="text-[#0F0F0F]">{row.title || row.slug}</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">교육 사례 편집</h1>

      <div className="mt-8">
        <CaseForm mode={{ kind: "edit", id: row.id }} initial={row} courses={courses} />
      </div>

      <div className="mt-16 border-t border-zinc-200 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
          위험 구역
        </h2>
        <div className="mt-4">
          <DeleteButton
            id={row.id}
            endpoint="/api/admin/cases"
            redirectTo="/admin/cases"
          />
        </div>
      </div>
    </section>
  );
}
