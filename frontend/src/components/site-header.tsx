import Image from "next/image";
import Link from "next/link";

import { CustomerNav } from "./customer-nav";
import { HeaderNav } from "./header-nav";
import { MobileNav } from "./mobile-nav";
import { TopStrip } from "./top-strip";

const NAV_ITEMS = [
  { href: "/ai-champion", label: "AI챔피언" },
  { href: "/quiz", label: "AI체험" },
  { href: "/courses", label: "교육과정" },
  { href: "/cases", label: "교육후기" },
  { href: "/insights", label: "인사이트" },
  { href: "/rentals", label: "강의실 대관" },
  { href: "/about", label: "데이지란?" },
  { href: "/support", label: "고객센터" },
];

export function SiteHeader() {
  return (
    <>
      <TopStrip />

      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="relative mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6 lg:px-10">
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
                className="h-9 w-auto"
                unoptimized
              />
            </Link>
            <HeaderNav items={NAV_ITEMS} />
          </div>
          <div className="flex items-center gap-1">
            <CustomerNav />
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-accent/90"
            >
              교육 문의
            </Link>
            <MobileNav items={NAV_ITEMS} />
          </div>
        </div>
      </header>
    </>
  );
}
