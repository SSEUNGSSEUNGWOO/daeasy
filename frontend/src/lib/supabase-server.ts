import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다.",
  );
}

/**
 * 요청 하나에 대응하는 Supabase 클라이언트. 세션 쿠키를 읽고 쓴다.
 *
 * 서버 컴포넌트에서는 쿠키 쓰기가 막혀 있어 setAll 이 예외를 던진다.
 * 토큰 갱신은 proxy.ts 가 담당하므로 여기서는 삼킨다.
 * Route Handler 에서 호출하면 쓰기가 정상 동작한다 (로그인·로그아웃이 이걸 쓴다).
 *
 * 요청마다 새로 만든다. 절대 모듈 최상단에서 만들어 공유하지 않는다.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const store = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서 호출된 경우. proxy.ts 가 갱신을 대신 기록한다.
        }
      },
    },
  });
}
