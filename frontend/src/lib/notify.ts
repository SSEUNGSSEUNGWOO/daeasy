import "server-only";

import { SITE_URL } from "@/lib/site";

/** 문의 접수 시 관리자 메일 알림 (Resend).
 *
 *  fail-open — 알림은 부가 기능이라 메일 실패가 문의 접수를 막으면 안 된다.
 *  env 미설정이면 조용히 건너뛴다 (로컬 개발 기본 상태).
 *  - RESEND_API_KEY: Resend API 키
 *  - INQUIRY_NOTIFY_EMAILS: 수신자 목록 (쉼표 구분)
 */
export async function notifyInquiry(params: {
  kind: "contact" | "rental";
  fields: Array<[label: string, value: string | null | undefined]>;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = (process.env.INQUIRY_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || recipients.length === 0) return;

  const kindLabel = params.kind === "contact" ? "교육 문의" : "대관 문의";
  const adminPath = params.kind === "contact" ? "/admin/inquiries/contact" : "/admin/inquiries/rentals";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rows = params.fields
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(
      ([label, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(label)}</td>` +
        `<td style="padding:6px 0;color:#111827;white-space:pre-wrap">${esc(String(v))}</td></tr>`,
    )
    .join("");

  const html =
    `<div style="font-family:sans-serif;font-size:14px;line-height:1.7">` +
    `<h2 style="font-size:16px">[데이지] 새 ${kindLabel}가 접수되었습니다</h2>` +
    `<table style="border-collapse:collapse">${rows}</table>` +
    `<p style="margin-top:16px"><a href="${SITE_URL}${adminPath}">어드민에서 확인하기 →</a></p>` +
    `</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DAEASY 문의 알림 <no-reply@daeasy.co.kr>",
        to: recipients,
        subject: `[데이지] 새 ${kindLabel} 접수`,
        html,
      }),
    });
    if (!res.ok) {
      console.error(`[notify] ${kindLabel} 메일 발송 실패:`, res.status, await res.text());
    }
  } catch (err) {
    console.error(`[notify] ${kindLabel} 메일 발송 오류:`, err);
  }
}
