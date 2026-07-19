import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * 로그인 세션(anon 키 + 사용자 JWT)에 바인딩된 서버 클라이언트.
 * Server Component/Server Action에서 사용 — RLS가 "본인 행만"·"관리자만"을 강제한다.
 * service role이 아니므로 Vercel에 배포해도 안전 (기존 방침 유지).
 */
export async function createServerAuthClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다.");
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 호출되면 쿠키를 못 씀 — middleware가 세션 갱신을 대신 처리하므로 무시해도 안전.
        }
      },
    },
  });
}
