import { redirect } from "next/navigation";

import { getCurrentCustomer } from "@/lib/customer-auth";

export const metadata = { title: "내 정보" };
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  const rows = [
    ["이름", customer.name],
    ["이메일", customer.email],
    ["연락처", customer.phone],
    ["소속", customer.organization],
  ];

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">마이페이지</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">내 정보</h1>
      <dl className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[100px_1fr] gap-4 py-5 text-sm">
            <dt className="font-bold text-zinc-600">{label}</dt>
            <dd className="text-zinc-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
