export default async function CourseDetailPage(
  props: PageProps<"/courses/[slug]">,
) {
  const { slug } = await props.params;
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-zinc-500">교육과정 / {slug}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">교육과정 상세</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        곧 공개됩니다.
      </p>
    </section>
  );
}
