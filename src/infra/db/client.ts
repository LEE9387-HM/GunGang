import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * 서버 전용 Supabase 클라이언트 (service role — RLS 우회).
 * import·관리자 배치처럼 서버에서만 실행되는 코드에서 사용한다.
 * 절대 클라이언트 번들에 포함하지 말 것 (SUPABASE_SERVICE_ROLE_KEY 노출 금지).
 */
export function createServiceClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다 (.env 확인).",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
