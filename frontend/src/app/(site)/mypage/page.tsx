import Link from "next/link";
import { redirect } from "next/navigation";

import { STATUS_LABEL, type InquiryStatus } from "@/lib/admin-inquiries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { CONTACT_EMAIL } from "@/lib/site";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata = { title: "내 정보" };
export const dynamic = "force-dynamic";

/** 최근 N건만 보여준다. 개인 문의가 그 이상 쌓일 시나리오가 아직 없어 페이지네이션은 두지 않는다. */
const LIMIT = 20;

type MyInquiry = {
  id: string;
  kind: "contact" | "rental";
  createdAt: string;
  status: InquiryStatus;
  /** 과정명(교육) 또는 희망 일시(대관) */
  detail: string | null;
  message: string;
};

type ContactRow = {
  id: string;
  created_at: string;
  status: InquiryStatus;
  message: string;
  course: { title: string } | null;
};

type RentalRow = {
  id: string;
  created_at: string;
  status: InquiryStatus;
  message: string;
  usage_date: string | null;
  time_slot: string | null;
};

/**
 * 두 문의 테이블을 user_id 로 조회해 시간순으로 합친다.
 * 조회에 실패하면 null 을 돌려준다 — 내 정보까지 같이 죽이지 않기 위함이다.
 */
async function fetchMyInquiries(userId: string): Promise<MyInquiry[] | null> {
  const sb = getSupabaseAdmin();

  const [contact, rental] = await Promise.all([
    sb
      .from("contact_inquiries")
      .select("id, created_at, status, message, course:courses(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    sb
      .from("rental_inquiries")
      .select("id, created_at, status, message, usage_date, time_slot")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  if (contact.error || rental.error) {
    // 둘의 실패 원인이 다를 수 있어 있는 것을 모두 남긴다
    console.error(
      "문의 내역 조회 실패:",
      [contact.error?.message, rental.error?.message].filter(Boolean).join(" / "),
    );
    return null;
  }

  const rows: MyInquiry[] = [
    ...((contact.data ?? []) as unknown as ContactRow[]).map((r) => ({
      id: r.id,
      kind: "contact" as const,
      createdAt: r.created_at,
      status: r.status,
      detail: r.course?.title ?? null,
      message: r.message,
    })),
    ...((rental.data ?? []) as unknown as RentalRow[]).map((r) => {
      // usage_date 는 date 컬럼이라 "2026-09-01" 로 온다. 접수일(국문 포맷)과
      // 나란히 놓이므로 포맷을 맞춘다.
      const when = [r.usage_date ? formatDate(r.usage_date) : null, r.time_slot]
        .filter(Boolean)
        .join(" · ");
      return {
        id: r.id,
        kind: "rental" as const,
        createdAt: r.created_at,
        status: r.status,
        // 접수일과 나란히 놓이므로 라벨이 없으면 어느 날짜인지 헷갈린다
        detail: when ? `희망 일시 ${when}` : null,
        message: r.message,
      };
    }),
  ];

  // ISO 문자열은 사전순 = 시간순이다. 로케일 비교는 런타임 ICU 콜레이션이 끼어들어 쓰지 않는다
  return rows
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .slice(0, LIMIT);
}

const STATUS_CLASS: Record<InquiryStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  closed: "bg-zinc-100 text-zinc-600",
};

/**
 * 어드민 어휘(신규/응대 중/완료)만으론 회원이 다음에 뭘 기대할지 알 수 없다.
 * 문의 폼이 약속한 "영업일 기준 1일 이내"를 여기서 다시 확인시킨다.
 */
const STATUS_HINT: Record<InquiryStatus, string> = {
  new: "접수되었습니다. 담당자가 영업일 기준 1일 이내로 연락드립니다.",
  contacted: "담당자가 확인해 처리하고 있습니다.",
  closed: "처리가 완료되었습니다.",
};

/** 서버(Vercel)는 UTC 로 돈다. KST 를 명시하지 않으면 접수일이 하루 어긋난다. */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

export default async function MyPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  const inquiries = await fetchMyInquiries(customer.id);

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

      <h2 className="mt-16 text-2xl font-semibold tracking-tight">문의 내역</h2>

      {inquiries === null ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm leading-[1.7] text-red-700">
          문의 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주시고, 계속 보이지 않으면 {CONTACT_EMAIL} 로 알려주세요.
        </p>
      ) : inquiries.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm leading-[1.8] text-zinc-500">
          이 계정으로 접수된 문의가 없습니다.
          <br />
          로그인 전에 남기신 문의는 계정에 연결되지 않아 표시되지 않습니다.
          <br />
          <Link href="/contact" className="mt-2 inline-block font-bold text-ink underline underline-offset-2">
            교육 문의하기
          </Link>
          <span className="mx-2 text-zinc-300">·</span>
          <Link href="/rentals" className="font-bold text-ink underline underline-offset-2">
            대관 문의하기
          </Link>
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200">
          {inquiries.map((row) => (
            <li key={`${row.kind}-${row.id}`} className="py-5">
              <details className="group">
                {/* Safari 는 list-none 만으론 삼각형이 남아 ::-webkit-details-marker 도 함께 숨긴다 */}
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                    <span className="font-bold text-zinc-900">
                      {row.kind === "contact" ? "교육 문의" : "대관 문의"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                    <span className="text-zinc-500">{formatDate(row.createdAt)}</span>
                    {/* 펼침 상태는 브라우저가 expanded 로 노출하므로 이 문자는 스크린리더에서 뺀다 */}
                    <span aria-hidden className="ml-auto text-zinc-400 transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </span>
                  {row.detail && (
                    <span className="mt-1.5 block text-[13px] text-zinc-600">{row.detail}</span>
                  )}
                  {/* 접힌 상태에서도 보여야 한다 — "언제 연락받나"가 이 화면에 온 이유다 */}
                  <span className="mt-1.5 block text-[13px] text-zinc-500">{STATUS_HINT[row.status]}</span>
                </summary>
                <p className="mt-3 whitespace-pre-wrap rounded-md bg-zinc-50 px-4 py-3 text-[13px] leading-[1.8] text-zinc-700">
                  {row.message.trim() || "작성한 내용이 없습니다."}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
