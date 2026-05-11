export default async function GuideDetailPage(
  props: PageProps<"/guides/[slug]">,
) {
  const { slug } = await props.params;
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-zinc-500">가이드 / {slug}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">가이드 상세</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">곧 공개됩니다.</p>
    </article>
  );
}
