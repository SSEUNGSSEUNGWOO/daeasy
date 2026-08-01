/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { RevealList } from "@/components/reveal";
import { fetchCases } from "@/lib/cases";

// 어드민에서 발행한 후기가 재배포 없이 반영되도록
export const revalidate = 60;

export const metadata = {
  title: "교육 후기",
  description: "진행한 교육의 실제 후기와 현장 사례. 공공기관·기업·교육기관의 AI · 데이터 도입 이야기.",
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

export default async function CasesPage() {
  const cases = await fetchCases();

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 lg:px-10 lg:pb-16 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Reviews
          </p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
            교육 후기.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            공공기관·기업·교육기관에서 진행한 AI · 데이터 교육의 현장 이야기.
          </p>
        </div>
      </section>

      {/* 카드 그리드 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
          {cases.length === 0 ? (
            <p className="rounded-2xl bg-white p-10 text-center text-[14px] text-zinc-500 ring-1 ring-zinc-100">
              곧 첫 후기가 등록됩니다.
            </p>
          ) : (
            <RevealList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cases.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/cases/${c.slug}`}
                    className="group block h-full overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                      {c.thumbnail_url ? (
                        <img
                          src={c.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : null}
                    </div>
                    <div className="p-6">
                      <p className="text-[12.5px] font-semibold tracking-[0.04em] text-zinc-500">
                        {formatDate(c.conducted_at)}
                      </p>
                      <h3 className="mt-3 line-clamp-3 text-[17px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                        {c.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-[14px] leading-[1.65] text-zinc-600">
                        {c.summary}
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
