import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-14 lg:px-10">
        <div className="grid grid-cols-12 gap-x-8 gap-y-10">
          <div className="col-span-12 md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label="daeasy 홈">
              <Image
                src="/logo/daeasy-symbol-mark.png"
                alt=""
                width={56}
                height={56}
                className="h-7 w-7"
                unoptimized
              />
              <Image
                src="/logo/daeasy-text-yellow-classic.svg"
                alt="daeasy"
                width={180}
                height={66}
                className="h-7 w-auto"
                unoptimized
              />
            </Link>
            <p className="mt-5 max-w-sm text-[13.5px] leading-[1.8] text-zinc-600">
              AI · 데이터를 업무에 도입 · 활용하려는 모든 조직과 사람을 위한 교육.
            </p>
            <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Est. 2024 · Seoul, Korea
            </p>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Programs
            </h4>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-zinc-700">
              <li><Link href="/courses" className="hover:text-zinc-900">교육과정</Link></li>
              <li><Link href="/cases" className="hover:text-zinc-900">교육후기</Link></li>
              <li><Link href="/contact" className="hover:text-zinc-900">교육 문의</Link></li>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-2">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Insights
            </h4>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-zinc-700">
              <li><Link href="/insights" className="hover:text-zinc-900">인사이트</Link></li>
              <li><Link href="/guides" className="hover:text-zinc-900">가이드</Link></li>
              <li><Link href="/about" className="hover:text-zinc-900">데이지란?</Link></li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-4">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Contact
            </h4>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-zinc-700">
              <li>data-edu@kbrainc.com</li>
              <li>070-5066-0995</li>
              <li className="text-zinc-500">서울시 동작구 보라매로5길 51 롯데타워 301~309호</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-zinc-200/70 pt-6 text-[12.5px] text-zinc-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} daeasy. All rights reserved.</span>
          <span>Made in Seoul</span>
        </div>
      </div>
    </footer>
  );
}
