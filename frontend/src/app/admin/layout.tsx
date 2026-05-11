import Link from "next/link";

export const metadata = { title: "어드민" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="w-56 shrink-0 border-r border-zinc-200 px-4 py-6 dark:border-zinc-800">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          daeasy admin
        </Link>
        <nav className="mt-8 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="text-xs uppercase tracking-wide text-zinc-400">콘텐츠</span>
          <span className="text-zinc-400">교육과정 (예정)</span>
          <span className="text-zinc-400">교육 사례 (예정)</span>
          <span className="text-zinc-400">가이드 (예정)</span>
          <span className="mt-4 text-xs uppercase tracking-wide text-zinc-400">뉴스레터</span>
          <span className="text-zinc-400">구독자 (예정)</span>
          <span className="text-zinc-400">발송호 (예정)</span>
        </nav>
      </aside>
      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}
