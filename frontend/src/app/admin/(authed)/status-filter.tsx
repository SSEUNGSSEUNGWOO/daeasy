import Link from "next/link";

import { STATUS_LABEL as INQUIRY_STATUS_LABEL } from "@/lib/admin-inquiries";

type Props<T extends string> = {
  basePath: string;
  current: T | "all";
  options: readonly T[];
  labels?: Record<T, string>;
};

export function StatusFilter<T extends string>({
  basePath,
  current,
  options,
  labels,
}: Props<T>) {
  const dict = (labels ?? INQUIRY_STATUS_LABEL) as Record<string, string>;
  const items: Array<{ key: string; label: string; href: string }> = [
    { key: "all", label: "전체", href: basePath },
    ...options.map((s) => ({
      key: s,
      label: dict[s] ?? s,
      href: `${basePath}?status=${s}`,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.key === current;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={
              active
                ? "rounded-full bg-[#0F0F0F] px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#0F0F0F]"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
