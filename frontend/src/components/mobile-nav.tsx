"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CustomerNav } from "./customer-nav";

type Item = { href: string; label: string };

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-700 transition hover:bg-zinc-100 lg:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M5 5l10 10" />
              <path d="M15 5L5 15" />
            </>
          ) : (
            <>
              <path d="M3 6h14" />
              <path d="M3 10h14" />
              <path d="M3 14h14" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute left-0 right-0 top-full border-b border-zinc-200/70 bg-white shadow-sm lg:hidden"
        >
          <nav className="mx-auto flex max-w-[1280px] flex-col px-6 py-2">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`border-b border-zinc-100 py-3.5 text-[15px] transition last:border-b-0 ${
                    active
                      ? "font-bold text-ink"
                      : "font-medium text-zinc-700 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-1 border-t border-zinc-200">
              <CustomerNav mobile onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
