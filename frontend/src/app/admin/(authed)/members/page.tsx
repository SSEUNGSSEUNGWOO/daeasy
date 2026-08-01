import { requireRole } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

import { ActiveToggle } from "./active-toggle";
import { MemberForm } from "./member-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "계정 관리" };

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export default async function MembersPage() {
  const me = await requireRole("admin");

  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("id,email,name,role,is_active,created_at")
    .order("created_at", { ascending: true })
    .returns<Row[]>();

  const rows = data ?? [];

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">계정 관리</h1>
      <p className="mt-3 text-zinc-600">
        직원 계정을 만들고 이메일과 초기 비밀번호를 직접 전달합니다.
      </p>

      <MemberForm />

      <table className="mt-10 w-full max-w-3xl text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500">
          <tr>
            <th className="py-2 font-medium">이름</th>
            <th className="py-2 font-medium">이메일</th>
            <th className="py-2 font-medium">역할</th>
            <th className="py-2 font-medium">상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-zinc-100">
              <td className="py-3">{row.name || "-"}</td>
              <td className="py-3">{row.email}</td>
              <td className="py-3">{row.role === "admin" ? "관리자" : "직원"}</td>
              <td className="py-3">
                {row.id === me.id ? (
                  <span className="text-zinc-400">본인</span>
                ) : (
                  <ActiveToggle id={row.id} isActive={row.is_active} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
