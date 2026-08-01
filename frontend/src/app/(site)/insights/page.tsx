/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { RevealList } from "@/components/reveal";
import { fetchInsights, type InsightSummary } from "@/lib/insights";

export const metadata = { title: "인사이트" };
export const revalidate = 60;

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value)).replace(/\.\s?$/, "").replace(/\.\s/g, ".");
}

export default async function InsightsPage() {
  const insights = await fetchInsights();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 anim-page-fade-up">
      <header className="max-w-2xl">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Insights
        </p>
        <h1 className="mt-3 text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[48px]">
          인사이트
        </h1>
        <p className="mt-4 text-[16px] leading-[1.7] text-zinc-600">
          AI · 데이터를 일터 언어로 바꿔서 매일 보내드립니다.
        </p>
      </header>

      {insights.length === 0 ? (
        <EmptyState />
      ) : (
        <RevealList className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {insights.map((insight) => (
            <li key={insight.slug}>
              <InsightCard insight={insight} />
            </li>
          ))}
        </RevealList>
      )}
    </section>
  );
}

function InsightCard({ insight }: { insight: InsightSummary }) {
  return (
    <Link
      href={`/insights/${insight.slug}`}
      className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-900"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-paper">
        {insight.image_url ? (
          <img
            src={insight.image_url}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          {insight.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-zinc-700"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="mt-3 text-[20px] font-bold leading-[1.3] tracking-[-0.015em] text-ink">
          {insight.title}
        </h2>
        <div className="mt-4 flex items-center gap-3 text-[12.5px] text-zinc-500">
          <time dateTime={insight.published_at} className="font-semibold tracking-[0.04em]">
            {formatDate(insight.published_at)}
          </time>
          <span aria-hidden className="text-zinc-300">·</span>
          <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {insight.view_count.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {insight.like_count.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 rounded-2xl border border-dashed border-zinc-300 bg-paper px-8 py-16 text-center">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        Coming soon
      </p>
      <p className="mt-3 text-[20px] font-bold tracking-[-0.015em] text-ink">
        곧 첫 번째 인사이트가 발행됩니다
      </p>
      <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">
        AI · 데이터 동향을 일터 언어로 정리해 매일 보내드립니다.
      </p>
    </div>
  );
}
