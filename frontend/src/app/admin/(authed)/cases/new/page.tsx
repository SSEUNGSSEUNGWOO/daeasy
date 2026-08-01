import Link from "next/link";

import { getSupabaseAdmin } from "@/lib/supabase";

import { CaseForm, type CourseOption } from "../case-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "교육 사례 신규" };

async function fetchCourses(): Promise<CourseOption[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("courses")
    .select("id, title")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CourseOption[];
}

export default async function AdminCaseNewPage() {
  const courses = await fetchCourses();
  return (
    <section>
      <div className="flex items-baseline gap-3 text-sm text-zinc-500">
        <Link href="/admin/cases" className="hover:text-ink">
          교육 사례
        </Link>
        <span>›</span>
        <span>신규</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">교육 사례 신규</h1>
      <div className="mt-8">
        <CaseForm mode={{ kind: "new" }} courses={courses} />
      </div>
    </section>
  );
}
