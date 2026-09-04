import { createHmac, timingSafeEqual } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/** 뉴스레터 메일의 수신 거부 링크.
 *
 *  링크는 `?e=<email>&s=<HMAC-SHA256(lower(email))>` 로 ai-service 가 서명해 보낸다
 *  (ai-service/insights/newsletter.py). 비회원 구독자도 로그인 없이 해지해야 해서 토큰 방식이다.
 *  GET 은 확인 화면만 — 메일 보안 스캐너가 링크를 미리 열어 해지시키는 사고를 막는다.
 *  실제 해지는 POST (확인 버튼 + RFC 8058 List-Unsubscribe 원클릭). */

function verify(email: string, sig: string): boolean {
  const secret = process.env.NEWSLETTER_UNSUB_SECRET;
  if (!secret || !email || !sig) return false;
  const expected = createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>뉴스레터 수신 거부 | DAEASY(데이지)</title></head>` +
      `<body style="margin:0;font-family:sans-serif;color:#18181b;background:#fafafa"><main style="max-width:480px;margin:80px auto;padding:32px 24px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;font-size:15px;line-height:1.7">${body}</main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function params(req: Request) {
  const sp = new URL(req.url).searchParams;
  return { email: (sp.get("e") ?? "").trim(), sig: sp.get("s") ?? "" };
}

export async function GET(req: Request) {
  const { email, sig } = params(req);
  if (!verify(email, sig)) return page("<p>링크가 올바르지 않거나 만료되었습니다.</p>", 400);
  return page(
    `<p><strong>${esc(email)}</strong> 주소로 가는 데이지 인사이트 뉴스레터를 더 이상 받지 않으시겠어요?</p>` +
      `<form method="post"><button type="submit" style="margin-top:12px;background:#18181b;color:#fff;font-weight:700;border:0;padding:12px 22px;border-radius:8px;cursor:pointer">수신 거부</button></form>`,
  );
}

export async function POST(req: Request) {
  const { email, sig } = params(req);
  if (!verify(email, sig)) return page("<p>링크가 올바르지 않거나 만료되었습니다.</p>", 400);

  const { error } = await getSupabaseAdmin()
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("email", email);
  if (error) return page("<p>처리에 실패했습니다. 잠시 후 다시 시도해주세요.</p>", 500);

  return page(
    `<p>수신 거부가 완료되었습니다. 더 이상 메일이 가지 않습니다.</p>` +
      `<p style="color:#71717a;font-size:13px">다시 받고 싶어지면 사이트 하단 구독 폼이나 마이페이지에서 언제든 재구독할 수 있습니다.</p>`,
  );
}
