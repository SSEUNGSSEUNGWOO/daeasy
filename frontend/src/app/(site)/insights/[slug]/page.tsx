/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LikeButton } from "@/components/insights/like-button";
import { TableOfContents, type TocItem } from "@/components/insights/toc";
import { ViewTracker } from "@/components/insights/view-tracker";
import { fetchInsight, type InsightDetail } from "@/lib/insights";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(value: string) {
  return dateFormatter
    .format(new Date(value))
    .replace(/\.\s?$/, "")
    .replace(/\.\s/g, ".");
}

function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "");
}

function extractToc(body: string): TocItem[] {
  const items: TocItem[] = [];
  let sectionIndex = 0;
  for (const line of body.split("\n")) {
    const numbered = line.match(/^(\d+)\.\s+###\s+(.+)/);
    if (numbered) {
      sectionIndex += 1;
      items.push({
        id: slugifyHeading(numbered[2].trim()),
        text: numbered[2].trim(),
        level: 3,
        index: sectionIndex,
      });
      continue;
    }
    const heading = line.match(/^(#{2,3})\s+(.+)/);
    if (heading) {
      items.push({
        id: slugifyHeading(heading[2].trim()),
        text: heading[2].trim(),
        level: heading[1].length,
      });
    }
  }
  return items;
}

export const revalidate = 60;

export async function generateMetadata(
  props: PageProps<"/insights/[slug]">,
) {
  const { slug } = await props.params;
  const insight = await fetchInsight(slug);
  if (!insight) return { title: "인사이트" };
  return { title: insight.title };
}

export default async function InsightDetailPage(
  props: PageProps<"/insights/[slug]">,
) {
  const { slug } = await props.params;
  const insight = await fetchInsight(slug);
  if (!insight) notFound();

  // ai-service가 이미 첫 H1을 제거하지만 옛 row 호환을 위해 안전장치 유지
  const cleanBody = insight.body.replace(/^#\s+[^\n]+\n+/, "");

  const tocItems: TocItem[] = [
    { id: "top", text: "제목", level: 2 },
    ...extractToc(cleanBody),
    ...(insight.sources.length > 0
      ? [{ id: "sources", text: "참고 출처", level: 2 }]
      : []),
  ];

  return (
    <article className="mx-auto max-w-6xl px-6 py-16 anim-page-fade-up">
      <ViewTracker slug={insight.slug} />

      <Link
        href="/insights"
        className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500 transition hover:text-zinc-900"
      >
        ← Insights
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_200px]">
        <div className="min-w-0">
          <header id="top">
            <div className="flex flex-wrap items-center gap-2">
              {insight.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-zinc-700"
                >
                  {tag}
                </span>
              ))}
              <time
                dateTime={insight.published_at}
                className="ml-auto text-[12px] font-semibold tracking-[0.04em] text-zinc-500"
              >
                {formatDate(insight.published_at)}
              </time>
            </div>
            <h1 className="mt-4 text-[36px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[44px]">
              {insight.title}
            </h1>
            <p className="mt-3 text-[12px] text-zinc-500">
              조회 {(insight.view_count ?? 0).toLocaleString()}회
            </p>
          </header>

          {insight.image_url ? (
            <div className="mt-10 overflow-hidden rounded-2xl bg-paper">
              <img
                src={insight.image_url}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="prose prose-zinc mt-12 max-w-none prose-headings:tracking-[-0.015em] prose-headings:text-ink prose-a:text-zinc-900 prose-a:underline-offset-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2
                    id={slugifyHeading(String(children))}
                    className="scroll-mt-24"
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    id={slugifyHeading(String(children))}
                    className="scroll-mt-24"
                  >
                    {children}
                  </h3>
                ),
              }}
            >
              {cleanBody}
            </ReactMarkdown>
          </div>

          <Sources sources={insight.sources} />

          <div className="mt-10 flex justify-center lg:hidden">
            <LikeButton slug={insight.slug} />
          </div>
        </div>

        <aside className="hidden lg:block">
          <TableOfContents items={tocItems} likeSlug={insight.slug} />
        </aside>
      </div>
    </article>
  );
}

function Sources({ sources }: { sources: InsightDetail["sources"] }) {
  if (sources.length === 0) return null;
  return (
    <section
      id="sources"
      className="mt-16 scroll-mt-24 border-t border-zinc-200 pt-10"
    >
      <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        참고 출처
      </h2>
      <ol className="mt-5 space-y-3">
        {sources.map((source, idx) => (
          <li
            key={`${source.url}-${idx}`}
            className="flex gap-3 text-[14px] leading-[1.6]"
          >
            <span className="font-mono text-zinc-400">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              {source.title || source.url}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
