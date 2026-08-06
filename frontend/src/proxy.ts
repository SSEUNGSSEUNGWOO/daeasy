import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 로그인 여부만 본다 (optimistic check).
 * 역할 판정은 여기서 하지 않는다 — Next.js 문서가 proxy 에서 DB 조회를 금지한다.
 * 역할은 각 페이지·핸들러가 lib/admin-auth.ts 로 확인한다.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, headerValue] of Object.entries(headers)) {
          response.headers.set(key, headerValue);
        }
      },
    },
  });

  // 응답이 확정되기 전에 호출해야 갱신된 토큰이 쿠키에 실린다.
  const { data } = await supabase.auth.getUser();

  if (pathname === "/admin/login") {
    // 일반 고객도 같은 Supabase Auth 세션을 쓴다. 여기서 로그인 여부만 보고
    // /admin 으로 보내면 고객 세션은 어드민 페이지와 로그인 사이에서 루프한다.
    // 역할 확인은 로그인 API와 각 어드민 페이지가 담당한다.
    return response;
  }

  if (!data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    if (pathname !== "/admin") {
      url.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
