import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCourse, fetchCourses } from "@/lib/courses";
import { sanitizeHtml } from "@/lib/sanitize";

import { CourseDescription } from "./course-description";

const TRACK_PATTERN = /^\[([^\]]+)\]\s*/;
const LEVEL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

function splitTrack(title: string): { track: string; clean: string } {
  const m = title.match(TRACK_PATTERN);
  if (!m) return { track: "공개 과정", clean: title };
  return { track: m[1], clean: title.slice(m[0].length) };
}

export async function generateMetadata(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const course = await fetchCourse(slug);
  if (!course) return { title: "교육과정" };
  const { clean } = splitTrack(course.title);
  return {
    title: clean,
    description: course.summary,
  };
}

export default async function CourseDetailPage(
  props: PageProps<"/courses/[slug]">,
) {
  const { slug } = await props.params;
  const course = await fetchCourse(slug);
  if (!course) notFound();

  const { track, clean } = splitTrack(course.title);
  const level = LEVEL_LABEL[course.level] ?? course.level;

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-16 lg:px-10 lg:pb-16 lg:pt-20 anim-page-fade-up">
          <nav aria-label="Breadcrumb" className="text-[13px] text-zinc-500">
            <Link href="/courses" className="hover:text-zinc-800">
              교육과정
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <span className="text-zinc-800">{clean}</span>
          </nav>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.12em] text-accent">
              {track}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              {level}
            </span>
          </div>
          <h1 className="mt-6 text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[48px] lg:text-[56px]">
            {clean}
          </h1>
          <p className="mt-7 max-w-3xl text-[18px] leading-[1.75] text-zinc-700">
            {course.summary}
          </p>
        </div>
      </section>

      {/* 본문 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20 reveal">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                커리큘럼
              </p>
              <h2 className="mt-3 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[32px]">
                커리큘럼.
              </h2>
              {course.description ? (
                <div className="mt-8">
                  <CourseDescription html={sanitizeHtml(course.description)} />
                </div>
              ) : (
                <div className="mt-8 rounded-2xl bg-white p-8 ring-1 ring-zinc-100">
                  <p className="text-[15px] leading-[1.85] text-zinc-700">
                    본 과정은 조직의 사전 인터뷰를 통해 학습 목표·인원·기간에 맞춰 커리큘럼이 설계됩니다.
                    상세한 차시 구성, 실습 데이터셋, 산출물 정의는 문의 주시면 제안서로 보내드립니다.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
                  >
                    커리큘럼 제안서 요청 →
                  </Link>
                </div>
              )}
            </div>
            <aside className="lg:col-span-4">
              <div className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  과정 정보
                </p>
                <dl className="mt-5 space-y-5">
                  <div>
                    <dt className="text-[12px] font-bold text-zinc-500">난이도</dt>
                    <dd className="mt-1 text-[15px] font-medium text-ink">{level}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-bold text-zinc-500">분류</dt>
                    <dd className="mt-1 text-[15px] font-medium text-ink">{track}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-bold text-zinc-500">기간 · 인원</dt>
                    <dd className="mt-1 text-[15px] text-zinc-700">조직 맞춤 (인터뷰 후 결정)</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-bold text-zinc-500">진행 방식</dt>
                    <dd className="mt-1 text-[15px] text-zinc-700">출강 / 공개 / 온라인 가능</dd>
                  </div>
                </dl>
                <Link
                  href="/contact"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3.5 text-[14px] font-bold text-white transition hover:bg-accent/90"
                >
                  교육 문의하기
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 다른 과정 보기 */}
      <RelatedCourses currentSlug={course.slug} level={course.level} />
    </>
  );
}

async function RelatedCourses({
  currentSlug,
  level,
}: {
  currentSlug: string;
  level: string;
}) {
  const all = await fetchCourses();
  const related = all
    .filter((c) => c.slug !== currentSlug && c.level === level)
    .slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20 reveal">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              다른 과정
            </p>
            <h2 className="mt-3 text-[24px] font-extrabold tracking-[-0.01em] text-ink sm:text-[28px]">
              같은 난이도의 다른 과정.
            </h2>
          </div>
          <Link href="/courses" className="text-[14px] font-bold text-zinc-600 hover:text-ink">
            전체 보기 →
          </Link>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 reveal-stagger">
          {related.map((c) => {
            const { track, clean } = splitTrack(c.title);
            return (
              <li key={c.slug}>
                <Link
                  href={`/courses/${c.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-zinc-50/70 p-7 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                >
                  <span className="self-start rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                    {track}
                  </span>
                  <h3 className="mt-4 text-[17px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                    {clean}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[14px] leading-[1.65] text-zinc-600">
                    {c.summary}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
