import Link from "next/link";

import { requireUser } from "@/lib/admin-auth";

import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";

export const metadata = { title: "어드민" };

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 px-4 py-6">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          daeasy admin
        </Link>
        <SidebarNav role={user.role} />
        <div className="mt-auto pt-6">
          <p className="mb-3 text-[13px] text-zinc-500">
            {user.name || user.email}
          </p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}
