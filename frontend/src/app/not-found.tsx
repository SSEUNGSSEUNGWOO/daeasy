import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "페이지를 찾을 수 없습니다" };

/**
 * 루트 not-found — 매칭되지 않는 모든 URL 과 notFound() 호출을 받는다.
 * (site) 레이아웃 바깥에서 렌더되므로 헤더·푸터를 직접 붙인다.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
          <div className="lg:col-span-6">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">404</p>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[52px]">
              길이 여기서<br />끊겨 있습니다.
            </h1>
            <p className="mt-7 max-w-md text-[17px] leading-[1.75] text-zinc-700">
              주소가 바뀌었거나 삭제된 페이지입니다. 찾으시는 내용은 교육과정이나 고객센터에서 다시 찾아보세요.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-ink px-6 py-3.5 text-[14px] font-bold text-white transition hover:bg-ink-hover"
              >
                홈으로
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-6 py-3.5 text-[14px] font-bold text-ink transition hover:bg-zinc-200"
              >
                교육과정 보기
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-zinc-100 lg:col-span-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illust/not-found.webp" alt="" className="aspect-[16/9] w-full object-cover" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
