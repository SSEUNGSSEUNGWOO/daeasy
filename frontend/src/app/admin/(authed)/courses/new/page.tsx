import Link from "next/link";

import { CourseForm } from "../course-form";

export const metadata = { title: "교육과정 신규" };

export default function AdminCourseNewPage() {
  return (
    <section>
      <div className="flex items-baseline gap-3 text-sm text-zinc-500">
        <Link href="/admin/courses" className="hover:text-[#0F0F0F]">
          교육과정
        </Link>
        <span>›</span>
        <span>신규</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">교육과정 신규</h1>
      <div className="mt-8">
        <CourseForm mode={{ kind: "new" }} />
      </div>
    </section>
  );
}
