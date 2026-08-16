"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function HeaderNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-7 text-[14.5px] font-medium text-zinc-700 lg:flex">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative py-1 transition ${
              active ? "font-semibold text-zinc-900" : "hover:text-zinc-900"
            }`}
          >
            {item.label}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-accent"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
