/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { RevealList } from "@/components/reveal";
import { fetchGuides } from "@/lib/guides";

export const metadata = {
  title: "가이드",
  description: "AI · 데이터 실무 가이드. RAG · LLM · 자동화 적용 패턴부터 도구별 활용 노하우까지.",
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function formatDate(value: string | null) {
  if (!value) return "";
  return dateFormatter.format(new Date(value)).replace(/\.\s?$/, "").replace(/\.\s/g, ".");
}

export default async function GuidesPage() {
  const guides = await fetchGuides();

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 lg:px-10 lg:pb-16 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Guides
          </p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
            가이드.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            실무에 바로 적용할 수 있는 AI · 데이터 가이드. 도구·워크플로우·패턴을 정리해 공유합니다.
          </p>
        </div>
      </section>

      {/* 카드 그리드 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
          {guides.length === 0 ? (
            <p className="rounded-2xl bg-white p-10 text-center text-[14px] text-zinc-500 ring-1 ring-zinc-100">
              곧 첫 가이드가 발행됩니다.
            </p>
          ) : (
            <RevealList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="group block h-full overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                      {g.cover_url ? (
                        <img
                          src={g.cover_url}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : null}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {g.category && (
                          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                            {g.category}
                          </span>
                        )}
                        {g.difficulty && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                            {g.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-[17px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                        {g.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-[14px] leading-[1.65] text-zinc-600">
                        {g.summary}
                      </p>
                      <p className="mt-4 text-[12.5px] font-semibold tracking-[0.04em] text-zinc-500">
                        {formatDate(g.published_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </RevealList>
          )}
        </div>
      </section>
    </>
  );
}
