import Link from "next/link";
import { notFound } from "next/navigation";

import { getSupabaseAdmin } from "@/lib/supabase";
import { isContentStatus, isCourseLevel } from "@/lib/admin-content";

import { CourseForm, type CourseFormInitial } from "../../course-form";
import { DeleteButton } from "../../delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "교육과정 편집" };

type Params = Promise<{ id: string }>;

async function fetchCourse(id: string): Promise<CourseFormInitial | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("courses")
    .select(
      "id, slug, title, summary, description, level, duration_hours, price, thumbnail_url, status, sort_order",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const level = isCourseLevel(data.level) ? data.level : "beginner";
  const status = isContentStatus(data.status) ? data.status : "draft";

  return {
    id: data.id as string,
    slug: (data.slug as string) ?? "",
    title: (data.title as string) ?? "",
    summary: (data.summary as string) ?? "",
    description: (data.description as string) ?? "",
    level,
    duration_hours: (data.duration_hours as number) ?? 0,
    price: (data.price as number | null) ?? null,
    thumbnail_url: (data.thumbnail_url as string | null) ?? null,
    status,
    sort_order: (data.sort_order as number) ?? 0,
  };
}

export default async function AdminCourseEditPage({ params }: { params: Params }) {
  const { id } = await params;
  const course = await fetchCourse(id);
  if (!course) notFound();

  return (
    <section>
      <div className="flex items-baseline gap-3 text-sm text-zinc-500">
        <Link href="/admin/courses" className="hover:text-ink">
          교육과정
        </Link>
        <span>›</span>
        <span className="text-ink">{course.title || course.slug}</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">교육과정 편집</h1>

      <div className="mt-8">
        <CourseForm mode={{ kind: "edit", id: course.id }} initial={course} />
      </div>

      <div className="mt-16 border-t border-zinc-200 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
          위험 구역
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          삭제하면 관련 문의의 course 연결도 해제됩니다 (FK on delete set null).
        </p>
        <div className="mt-4">
          <DeleteButton
            id={course.id}
            endpoint="/api/admin/courses"
            redirectTo="/admin/courses"
          />
        </div>
      </div>
    </section>
  );
}
