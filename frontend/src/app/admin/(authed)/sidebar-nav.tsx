"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const inquiryItems: Item[] = [
  { href: "/admin/inquiries/contact", label: "교육 문의" },
  { href: "/admin/inquiries/rentals", label: "대여 문의" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="text-xs uppercase tracking-wide text-zinc-400">문의</span>
      {inquiryItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "font-semibold text-[#0F0F0F] dark:text-white"
                : "hover:text-[#0F0F0F] dark:hover:text-white"
            }
          >
            {item.label}
          </Link>
        );
      })}
      <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">콘텐츠</span>
      <span className="text-zinc-400">교육과정 (예정)</span>
      <span className="text-zinc-400">교육 사례 (예정)</span>
      <span className="text-zinc-400">가이드 (예정)</span>
      <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">뉴스레터</span>
      <span className="text-zinc-400">구독자 (예정)</span>
      <span className="text-zinc-400">발송호 (예정)</span>
    </nav>
  );
}
