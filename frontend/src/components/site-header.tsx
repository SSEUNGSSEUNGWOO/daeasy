import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/about", label: "데이지란?" },
  { href: "/courses", label: "교육과정" },
  { href: "/rentals", label: "강의실 대관" },
  { href: "/cases", label: "교육후기" },
  { href: "/insights", label: "인사이트" },
  { href: "/guides", label: "가이드" },
  { href: "/support", label: "고객센터" },
];

export function SiteHeader() {
  return (
    <>
      <div className="bg-accent text-white">
        <div className="mx-auto flex h-10 max-w-[1280px] items-center justify-center px-6 text-[12.5px]">
          <span className="font-medium">조직에 맞는 AI 도입, 어디부터 시작할지 모르겠다면 —</span>
          <Link
            href="/contact"
            className="ml-1.5 font-bold underline-offset-4 hover:underline"
          >
            무료 상담 신청 →
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5" aria-label="daeasy 홈">
              <Image
                src="/logo/daeasy-symbol-mark.png"
                alt=""
                width={56}
                height={56}
                priority
                className="h-7 w-7"
                unoptimized
              />
              <Image
                src="/logo/daeasy-text-yellow-classic.svg"
                alt="daeasy"
                width={180}
                height={66}
                priority
                className="block h-9 w-auto dark:hidden"
                unoptimized
              />
              <Image
                src="/logo/daeasy-text-onDark.svg"
                alt="daeasy"
                width={180}
                height={66}
                priority
                className="hidden h-9 w-auto dark:block"
                unoptimized
              />
            </Link>
            <nav className="hidden items-center gap-7 text-[14.5px] font-medium text-zinc-700 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-zinc-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-accent/90"
          >
            교육 문의
          </Link>
        </div>
      </header>
    </>
  );
}
