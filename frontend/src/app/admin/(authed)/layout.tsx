import Link from "next/link";

import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";

export const metadata = { title: "어드민" };

export default function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 px-4 py-6 dark:border-zinc-800">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          daeasy admin
        </Link>
        <SidebarNav />
        <div className="mt-auto pt-6">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}
