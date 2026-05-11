/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCase } from "@/lib/cases";
import { sanitizeHtml } from "@/lib/sanitize";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function formatDate(value: string | null) {
  if (!value) return "";
  return dateFormatter.format(new Date(value)).replace(/\.\s?$/, "").replace(/\.\s/g, ".");
}

export async function generateMetadata(props: PageProps<"/cases/[slug]">) {
  const { slug } = await props.params;
  const c = await fetchCase(slug);
  if (!c) return { title: "교육 후기" };
  return { title: c.title, description: c.summary };
}

export default async function CaseDetailPage(props: PageProps<"/cases/[slug]">) {
  const { slug } = await props.params;
  const c = await fetchCase(slug);
  if (!c) notFound();

  return (
    <article className="mx-auto max-w-[820px] px-6 py-16 lg:py-20">
      <Link
        href="/cases"
        className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500 transition hover:text-zinc-900"
      >
        ← Reviews
      </Link>

      <header className="mt-8">
        <p className="text-[12.5px] font-semibold tracking-[0.04em] text-zinc-500">
          {formatDate(c.conducted_at)}
          {c.client_name ? <span className="ml-2 text-zinc-400">·</span> : null}
          {c.client_name ? <span className="ml-2 text-zinc-700">{c.client_name}</span> : null}
        </p>
        <h1 className="mt-4 text-[32px] font-extrabold leading-[1.18] tracking-[-0.02em] text-[#0F0F0F] sm:text-[40px]">
          {c.title}
        </h1>
      </header>

      {c.thumbnail_url ? (
        <div className="mt-10 overflow-hidden rounded-2xl bg-zinc-100">
          <img src={c.thumbnail_url} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      ) : null}

      <div
        className="prose prose-zinc mt-12 max-w-none text-[16px] leading-[1.85] prose-p:my-4"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.description) }}
      />

      <div className="mt-16 rounded-2xl bg-zinc-50/70 p-8 ring-1 ring-zinc-100">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
          Get in touch
        </p>
        <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.01em] text-[#0F0F0F]">
          비슷한 교육이 필요하신가요?
        </h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-zinc-700">
          조직 규모와 학습 목표를 알려주시면 가장 가까운 커리큘럼을 제안드립니다.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#0F0F0F] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#1a1a1a]"
        >
          교육 문의하기 →
        </Link>
      </div>
    </article>
  );
}
