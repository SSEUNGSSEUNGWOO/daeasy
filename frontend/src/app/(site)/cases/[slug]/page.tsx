/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { LikeButton } from "@/components/insights/like-button";
import { TableOfContents, type TocItem } from "@/components/insights/toc";
import { ViewTracker } from "@/components/insights/view-tracker";
import { fetchCase, fetchCaseLikeCount } from "@/lib/cases";
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

function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "");
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * sanitizeHtml() 을 통과한 본문의 h2 에 목차용 id 를 주입한다.
 * sanitize 정책은 id 속성을 허용하지 않으므로, 신뢰할 수 있는 값(slugify 결과)을
 * sanitize 이후에 우리 코드가 붙이는 방식으로 정책을 건드리지 않는다.
 */
function injectHeadingIds(sanitized: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();
  const html = sanitized.replace(
    /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
    (_m, inner: string) => {
      const text = stripTags(inner);
      let id = slugifyHeading(text) || "section";
      const n = seen.get(id) ?? 0;
      seen.set(id, n + 1);
      if (n > 0) id = `${id}-${n + 1}`;
      toc.push({ id, text, level: 2 });
      return `<h2 id="${id}" class="scroll-mt-24">${inner}</h2>`;
    },
  );
  return { html, toc };
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
  const likeCount = await fetchCaseLikeCount(slug);

  // 본문은 반드시 sanitizeHtml() 을 먼저 통과시킨다 (기존 정책 동일)
  const { html: bodyHtml, toc } = injectHeadingIds(sanitizeHtml(c.description));
  const tocItems: TocItem[] = [
    { id: "top", text: "제목", level: 2 },
    ...toc,
    { id: "contact-cta", text: "교육 문의", level: 2 },
  ];

  return (
    <article className="mx-auto max-w-6xl px-6 py-16 lg:py-20 anim-page-fade-up">
      <ViewTracker slug={c.slug} resource="cases" />
      <Link
        href="/cases"
        className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500 transition hover:text-zinc-900"
      >
        ← 교육후기
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_200px]">
        <div className="min-w-0">
          <header id="top">
            <p className="text-[12.5px] font-semibold tracking-[0.04em] text-zinc-500">
              {formatDate(c.conducted_at)}
              {c.client_name ? <span className="ml-2 text-zinc-400">·</span> : null}
              {c.client_name ? <span className="ml-2 text-zinc-700">{c.client_name}</span> : null}
            </p>
            <h1 className="mt-4 text-[32px] font-extrabold leading-[1.18] tracking-[-0.02em] text-ink sm:text-[40px]">
              {c.title}
            </h1>
            <p className="mt-3 text-[12px] text-zinc-500">
              조회 {(c.view_count ?? 0).toLocaleString()}회
              {likeCount > 0 ? (
                <span className="ml-2">
                  · 좋아요 {likeCount.toLocaleString()}
                </span>
              ) : null}
            </p>
          </header>

          {c.thumbnail_url ? (
            <div className="mt-10 overflow-hidden rounded-2xl bg-zinc-100 anim-cover-scale-fade">
              <img src={c.thumbnail_url} alt="" className="aspect-[16/9] w-full object-cover" />
            </div>
          ) : null}

          <div
            className="prose prose-zinc mt-12 max-w-none text-[16px] leading-[1.85] prose-p:my-4"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          <div
            id="contact-cta"
            className="mt-16 scroll-mt-24 rounded-2xl bg-zinc-50/70 p-8 ring-1 ring-zinc-100"
          >
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
              교육 문의
            </p>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.01em] text-ink">
              비슷한 교육이 필요하신가요?
            </h2>
            <p className="mt-3 text-[15px] leading-[1.8] text-zinc-700">
              조직 규모와 학습 목표를 알려주시면 가장 가까운 커리큘럼을 제안드립니다.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
            >
              교육 문의하기 →
            </Link>
          </div>

          <div className="mt-10 flex justify-center lg:hidden">
            <LikeButton slug={c.slug} resource="cases" />
          </div>
        </div>

        <aside className="hidden lg:block">
          <TableOfContents items={tocItems} likeSlug={c.slug} likeResource="cases" />
        </aside>
      </div>
    </article>
  );
}
