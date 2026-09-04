/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { LikeButton } from "@/components/insights/like-button";
import { TableOfContents, type TocItem } from "@/components/insights/toc";
import { ViewTracker } from "@/components/insights/view-tracker";
import { fetchCase, fetchCaseLikeCount, fetchCasesBySlugs } from "@/lib/cases";
import { SITE_URL } from "@/lib/site";
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

/**
 * 홍보발행 파이프라인(prpub site.py)이 본문 끝에 남기는 '함께 보면 좋은 글' 블록 —
 * `<hr>` → `<p>함께 보면 좋은 글</p>` → URL 만 든 `<p>`/`<ul>` — 을 본문에서 떼어내고
 * 그 안의 /cases/<slug> 링크만 뽑는다. 네이버에선 에디터가 URL 을 썸네일 카드로
 * 바꿔주지만 사이트는 그냥 글자 링크라, 여기서 카드로 다시 그린다.
 * 블록이 없는 글(어드민에서 손으로 쓴 옛 글)은 그대로 둔다.
 */
const RELATED_HEAD = /(?:<hr\s*\/?>\s*)?<p>함께 보면 좋은 글<\/p>\s*/;
// URL 줄 하나가 `<p>` 하나로 오기도 하고(줄 사이 빈 줄), `<br>` 로 묶여 오기도 하고, `- ` 목록이면 `<ul>` 로 온다
const URL_ONLY_BLOCK = /^(?:<p>(?:\s*<a\b[^>]*>[^<]*<\/a>\s*(?:<br\s*\/?>)?\s*)+<\/p>|<ul>(?:\s*<li>\s*<a\b[^>]*>[^<]*<\/a>\s*<\/li>\s*)+<\/ul>)\s*/;
const CASE_HREF = /href="(?:https?:\/\/[^/"]+)?\/cases\/([^"/?#]+)"/g;

function splitRelatedBlock(sanitized: string, selfSlug: string): { html: string; slugs: string[] } {
  const head = sanitized.match(RELATED_HEAD);
  if (!head || head.index === undefined) return { html: sanitized, slugs: [] };
  const start = head.index;
  let end = start + head[0].length;
  let block: RegExpMatchArray | null;
  while ((block = sanitized.slice(end).match(URL_ONLY_BLOCK))) end += block[0].length;

  const slugs: string[] = [];
  for (const hit of sanitized.slice(start, end).matchAll(CASE_HREF)) {
    const s = decodeURIComponent(hit[1]);
    if (s !== selfSlug && !slugs.includes(s)) slugs.push(s);
  }
  return { html: sanitized.slice(0, start) + sanitized.slice(end), slugs };
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
  const { html: bodyWithoutRelated, slugs: relatedSlugs } = splitRelatedBlock(
    sanitizeHtml(c.description),
    c.slug,
  );
  const { html: bodyHtml, toc } = injectHeadingIds(bodyWithoutRelated);
  const related = await fetchCasesBySlugs(relatedSlugs);
  const tocItems: TocItem[] = [
    { id: "top", text: "제목", level: 2 },
    ...toc,
    ...(related.length > 0 ? [{ id: "related", text: "함께 보면 좋은 글", level: 2 }] : []),
    { id: "contact-cta", text: "교육 문의", level: 2 },
  ];

  return (
    <article className="mx-auto max-w-6xl px-6 py-16 lg:py-20 anim-page-fade-up">
      {/* 자사 교육 후기라 Review(별점) 대신 Article 로 마크업 — 자기 리뷰는
          구글 리치결과 대상에서 제외되므로 정직하게 사례 글로 선언한다 */}
      <JsonLd
        id="case-article-ld"
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: c.title.slice(0, 110),
          ...(c.conducted_at ? { datePublished: c.conducted_at } : {}),
          ...(c.thumbnail_url ? { image: `${SITE_URL}${c.thumbnail_url}` } : {}),
          author: { "@type": "Organization", name: "DAEASY(데이지)" },
          publisher: {
            "@type": "Organization",
            name: "DAEASY(데이지)",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/logo/daeasy-symbol-mark.png` },
          },
          mainEntityOfPage: `${SITE_URL}/cases/${encodeURIComponent(c.slug)}`,
        }}
      />
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

          {related.length > 0 ? (
            <section id="related" className="mt-16 scroll-mt-24">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                함께 보면 좋은 글
              </p>
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/cases/${r.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                    >
                      <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                        {r.thumbnail_url ? (
                          <img
                            src={r.thumbnail_url}
                            alt=""
                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                          />
                        ) : null}
                      </div>
                      <div className="p-5">
                        <h3 className="line-clamp-2 text-[16px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                          {r.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-[13.5px] leading-[1.65] text-zinc-600">
                          {r.summary}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

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
