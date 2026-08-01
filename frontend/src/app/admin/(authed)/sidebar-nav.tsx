"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminRole } from "@/lib/admin-auth";

type Item = { href: string; label: string };

const inquiryItems: Item[] = [
  { href: "/admin/inquiries/contact", label: "교육 문의" },
  { href: "/admin/inquiries/rentals", label: "대관 문의" },
];

/** editor 도 쓰는 메뉴 */
const sharedContentItems: Item[] = [
  { href: "/admin/courses", label: "교육과정" },
  { href: "/admin/cases", label: "교육 사례" },
];

/** admin 전용 메뉴 */
const adminContentItems: Item[] = [
  { href: "/admin/insights", label: "인사이트" },
  { href: "/admin/guides", label: "가이드" },
];

const settingItems: Item[] = [{ href: "/admin/members", label: "계정" }];

export function SidebarNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  const renderItem = (item: Item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={active ? "font-semibold text-ink" : "hover:text-ink"}
      >
        {item.label}
      </Link>
    );
  };

  const contentItems = isAdmin
    ? [...sharedContentItems, ...adminContentItems]
    : sharedContentItems;

  return (
    <nav className="mt-8 flex flex-col gap-2 text-sm text-zinc-600">
      {isAdmin && (
        <>
          <span className="text-xs uppercase tracking-wide text-zinc-400">문의</span>
          {inquiryItems.map(renderItem)}
        </>
      )}
      <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">콘텐츠</span>
      {contentItems.map(renderItem)}
      {isAdmin && (
        <>
          <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">설정</span>
          {settingItems.map(renderItem)}
        </>
      )}
    </nav>
  );
}
