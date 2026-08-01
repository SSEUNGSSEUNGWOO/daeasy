import Link from "next/link";

import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function countInquiries() {
  const sb = getSupabaseAdmin();
  const [contact, rentals] = await Promise.all([
    sb
      .from("contact_inquiries")
      .select("status", { count: "exact", head: false })
      .eq("status", "new"),
    sb
      .from("rental_inquiries")
      .select("status", { count: "exact", head: false })
      .eq("status", "new"),
  ]);
  return {
    contactNew: contact.count ?? 0,
    rentalNew: rentals.count ?? 0,
  };
}

export default async function AdminHomePage() {
  const counts = await countInquiries();

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">어드민</h1>
      <p className="mt-3 text-zinc-600">
        새 문의를 확인하고 상태를 관리합니다.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-2xl">
        <Link
          href="/admin/inquiries/contact"
          className="rounded-2xl border border-zinc-200 p-6 transition hover:border-zinc-300 hover:shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            교육 문의
          </p>
          <p className="mt-3 text-3xl font-bold text-ink">
            {counts.contactNew}
            <span className="ml-1 text-sm font-normal text-zinc-500">new</span>
          </p>
        </Link>
        <Link
          href="/admin/inquiries/rentals"
          className="rounded-2xl border border-zinc-200 p-6 transition hover:border-zinc-300 hover:shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            대여 문의
          </p>
          <p className="mt-3 text-3xl font-bold text-ink">
            {counts.rentalNew}
            <span className="ml-1 text-sm font-normal text-zinc-500">new</span>
          </p>
        </Link>
      </div>
    </section>
  );
}
