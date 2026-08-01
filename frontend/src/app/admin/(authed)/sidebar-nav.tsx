"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const inquiryItems: Item[] = [
  { href: "/admin/inquiries/contact", label: "교육 문의" },
  { href: "/admin/inquiries/rentals", label: "대여 문의" },
];

const contentItems: Item[] = [
  { href: "/admin/courses", label: "교육과정" },
  { href: "/admin/cases", label: "교육 사례" },
  { href: "/admin/insights", label: "인사이트" },
  { href: "/admin/guides", label: "가이드" },
];

export function SidebarNav() {
  const pathname = usePathname();

  const renderItem = (item: Item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={
          active
            ? "font-semibold text-ink"
            : "hover:text-ink"
        }
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="mt-8 flex flex-col gap-2 text-sm text-zinc-600">
      <span className="text-xs uppercase tracking-wide text-zinc-400">문의</span>
      {inquiryItems.map(renderItem)}
      <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">콘텐츠</span>
      {contentItems.map(renderItem)}
    </nav>
  );
}
