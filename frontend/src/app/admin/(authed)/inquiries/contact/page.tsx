import { getSupabaseAdmin } from "@/lib/supabase";
import { INQUIRY_STATUSES, isInquiryStatus, type InquiryStatus } from "@/lib/admin-inquiries";

import { ContactInquiriesTable, type ContactInquiryRow } from "./inquiries-table";
import { StatusFilter } from "../../status-filter";

export const dynamic = "force-dynamic";
export const metadata = { title: "교육 문의" };

const PAGE_SIZE = 100;

type SearchParams = Promise<{ status?: string }>;

async function fetchInquiries(status: InquiryStatus | "all"): Promise<ContactInquiryRow[]> {
  const sb = getSupabaseAdmin();
  let q = sb
    .from("contact_inquiries")
    .select(
      "id, name, email, phone, company, message, status, created_at, course:courses(slug, title)",
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (status !== "all") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ContactInquiryRow[];
}

export default async function ContactInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status: InquiryStatus | "all" = isInquiryStatus(params.status)
    ? params.status
    : "all";

  const inquiries = await fetchInquiries(status);

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">교육 문의</h1>
          <p className="mt-2 text-sm text-zinc-500">
            /contact 폼에서 접수된 문의. 최근 {PAGE_SIZE}건.
          </p>
        </div>
        <p className="text-sm text-zinc-500">총 {inquiries.length}건</p>
      </div>

      <div className="mt-6">
        <StatusFilter
          basePath="/admin/inquiries/contact"
          current={status}
          options={INQUIRY_STATUSES}
        />
      </div>

      <div className="mt-6">
        <ContactInquiriesTable inquiries={inquiries} />
      </div>
    </section>
  );
}
